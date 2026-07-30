/* ============================================================
 * wbSync — Supabase 云端同步层（无侵入接入）
 * 原理：在 app.js 加载前代理 localStorage.setItem/removeItem，
 *       所有 wb_* 写入自动异步推送到 Supabase；
 *       启动时拉取云端数据合并到本地（last-write-wins），
 *       并通过 Realtime 订阅多端实时同步。
 * 加载顺序：supabase.min.js → sync.js → app.js
 * ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://sasmhbzhcwoqkmfrrfvb.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_koYORgkHDpoHDDh1exqBzA_7N_kdEp5';
  // 个人单用户工作台：所有设备共用同一个 USER_ID 即实现"多端同步"
  var USER_ID = 'edys-workbench';
  var META_KEY = '_wb_sync_meta'; // 记录每个 key 的最后同步时间戳（不参与同步）
  var EXCLUDE = { _wb_sync_meta: 1 };

  var client = null;
  var ready = false;
  var online = false;
  var queue = {};            // key -> value(string)，待推送
  var flushTimer = null;
  var retryTimer = null;
  var channel = null;

  function shouldSync(k) { return typeof k === 'string' && k.charAt(0) === 'w' && k.charAt(1) === 'b' && k.charAt(2) === '_' && !EXCLUDE[k]; }
  function getMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (e) { return {}; } }
  function setMetaTs(k, ts) { var m = getMeta(); m[k] = ts; try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }

  /* ---------- 状态徽标 ---------- */
  var badge = null;
  function ensureBadge() {
    if (badge) return badge;
    badge = document.createElement('div');
    badge.id = 'wbSyncBadge';
    badge.title = '云端同步状态';
    badge.innerHTML = '<span class="dot"></span><span class="txt">同步</span>';
    document.body.appendChild(badge);
    return badge;
  }
  function setStatus(state, text) {
    if (!badge) return;
    badge.className = 'wb-sync-' + state;
    var t = badge.querySelector('.txt'); if (t) t.textContent = text || '同步';
  }

  /* ---------- 推送（防抖批量 upsert） ---------- */
  function queuePush(key, value) {
    queue[key] = value;
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 500);
  }
  function flush() {
    flushTimer = null;
    if (!ready || !online) return; // 离线/未就绪：保留在 queue 里，连接后重试
    var rows = [];
    for (var k in queue) {
      if (!shouldSync(k)) { delete queue[k]; continue; }
      var raw = queue[k];
      var val;
      try { val = JSON.parse(raw); } catch (e) { val = { _raw: raw }; }
      rows.push({ user_id: USER_ID, key: k, value: val, updated_at: Date.now() });
    }
    queue = {};
    if (!rows.length) return;
    setStatus('syncing', '同步中');
    client.from('kv_store').upsert(rows).then(function (r) {
      if (r.error) { setStatus('error', '同步失败'); scheduleRetry(); }
      else { setStatus('ok', '已同步'); }
    }).catch(function () { setStatus('error', '同步失败'); scheduleRetry(); });
  }
  function scheduleRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () { retryTimer = null; flush(); }, 8000);
  }

  /* ---------- 拉取云端合并 ---------- */
  function pullAll() {
    if (!ready) return;
    client.from('kv_store').select('*').eq('user_id', USER_ID).then(function (r) {
      if (r.error) { setStatus('error', '拉取失败'); return; }
      var meta = getMeta();
      var changed = false;
      (r.data || []).forEach(function (row) {
        var localTs = meta[row.key] || 0;
        if (row.updated_at > localTs) {
          var str = (typeof row.value === 'string') ? row.value : JSON.stringify(row.value);
          _setItem.call(localStorage, row.key, str); // 用原始方法写，避免回推
          meta[row.key] = row.updated_at;
          changed = true;
        }
      });
      try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
      if (changed) { window.dispatchEvent(new CustomEvent('wb:remote', { detail: { reason: 'pull' } })); }
    }).catch(function () {});
  }

  /* ---------- 应用远端实时变更 ---------- */
  function applyRemote(row) {
    if (!row || row.user_id !== USER_ID) return;
    var meta = getMeta();
    var localTs = meta[row.key] || 0;
    if (row.updated_at > localTs) {
      var str = (typeof row.value === 'string') ? row.value : JSON.stringify(row.value);
      _setItem.call(localStorage, row.key, str);
      meta[row.key] = row.updated_at;
      try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
      window.dispatchEvent(new CustomEvent('wb:remote', { detail: { key: row.key } }));
    }
  }

  /* ---------- Realtime 订阅 ---------- */
  function subscribe() {
    if (!client) return;
    try {
      channel = client.channel('kv-store-' + USER_ID)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kv_store', filter: 'user_id=eq.' + USER_ID }, function (payload) {
          if (payload.eventType === 'DELETE') return;
          applyRemote(payload.new);
        })
        .subscribe(function (status) {
          if (status === 'SUBSCRIBED') { online = true; setStatus('ok', '实时同步'); }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { online = false; setStatus('error', '连接断开'); }
        });
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    ensureBadge();
    setStatus('connecting', '连接中');
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      setStatus('error', '库未加载'); return;
    }
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        realtime: true,
        autoRefreshToken: false,
        auth: { persistSession: false }
      });
    } catch (e) { setStatus('error', '初始化失败'); return; }
    ready = true;
    // 先拉一次，再订阅
    pullAll();
    subscribe();
    // 网络恢复后补推
    window.addEventListener('online', function () { online = true; setStatus('ok', '已同步'); flush(); });
    window.addEventListener('offline', function () { online = false; setStatus('error', '离线'); });
  }

  /* ---------- 公共 API ---------- */
  window.wbSync = {
    get enabled() { return ready; },
    init: init,
    // 备份模块导入后，主动把全部本地数据推上云
    pushAll: function () {
      if (!ready) return;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (shouldSync(k)) queuePush(k, localStorage.getItem(k));
      }
      flush();
    },
    status: function () { return badge ? badge.className : ''; }
  };

  /* ---------- 代理 localStorage（必须在 app.js 之前执行） ---------- */
  var _setItem = localStorage.setItem.bind(localStorage);
  var _removeItem = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    var r = _setItem(key, value);
    if (shouldSync(key)) queuePush(key, value);
    return r;
  };
  localStorage.removeItem = function (key) {
    var r = _removeItem(key);
    if (shouldSync(key) && ready && online) {
      client.from('kv_store').delete().eq('user_id', USER_ID).eq('key', key);
      setMetaTs(key, Date.now());
    }
    return r;
  };

  // 立即初始化（DOM 可能还没 ready，但 createClient 不需要 DOM）
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
