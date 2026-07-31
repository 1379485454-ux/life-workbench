/* ============================================================
 * wbSync — 同源轻量同步层（替代海外 Supabase）
 * 原理：在 app.js 加载前代理 localStorage.setItem/removeItem，
 *       所有 wb_* 写入自动异步推送到同源 /api/sync；
 *       启动时拉取云端数据合并到本地（last-write-wins），
 *       之后每 4 秒轮询增量，实现多端近实时同步。
 * 加载顺序：sync.js → app.js（不再依赖 supabase.min.js）
 *
 * 为什么换掉 Supabase：原方案同步请求发往海外 supabase.co，
 *   iOS Safari 的「阻止跨站跟踪 / 内容拦截器 / Private Relay」
 *   会直接丢弃这类跨站请求，表现为 TypeError: Load failed。
 *   改为同源 /api/sync 后，请求与页面同域，不再被拦截。
 * ============================================================ */
(function () {
  'use strict';

  var USER_ID = 'edys-workbench'; // 与 server.js SYNC_USER_ID 一致；多端共用即实现多端同步
  var META_KEY = '_wb_sync_meta'; // 记录每个 key 的最后修改时间戳（不参与同步）
  var EXCLUDE = { _wb_sync_meta: 1 };
  var API = '/api/sync';
  var POLL_INTERVAL = 4000; // 增量轮询间隔（毫秒）

  var ready = false;     // 同步后端可用
  var online = false;    // 当前网络在线
  var localOnly = false; // 无同步后端（如纯静态部署），仅本机
  var queue = {};        // key -> value(string)，待推送
  var flushTimer = null;
  var retryTimer = null;
  var pollTimer = null;
  var lastTs = 0;        // 本地已知的最大 updated_at（轮询增量用）
  var lastError = null;  // 最近一次失败的真实原因（前端诊断用）
  var pullRetryCount = 0;
  var pullRetryTimer = null;
  var MAX_PULL_RETRIES = 8;
  var badge = null;

  function shouldSync(k) {
    return typeof k === 'string' && k.charAt(0) === 'w' && k.charAt(1) === 'b' && k.charAt(2) === '_' && !EXCLUDE[k];
  }
  function getMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (e) { return {}; } }
  function setMetaTs(k, ts) { var m = getMeta(); m[k] = ts; try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
  function getMetaMaxTs() { var m = getMeta(); var mx = 0; for (var k in m) if (m[k] > mx) mx = m[k]; return mx; }

  /* ---------- 状态徽标 ---------- */
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

  /* ---------- 推送（防抖批量 upsert，带本地时间戳） ---------- */
  function queuePush(key, value) {
    queue[key] = value;
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 500);
  }
  function flush() {
    flushTimer = null;
    var meta = getMeta();
    var rows = [];
    for (var k in queue) {
      if (!shouldSync(k)) { delete queue[k]; continue; }
      rows.push({ key: k, value: queue[k], updated_at: meta[k] || Date.now() });
    }
    queue = {};
    flushItems(rows);
  }
  function unwrap(resp) { return (resp && resp.ok === true && typeof resp.data === 'object') ? resp.data : resp; }

  function flushItems(rows) {
    if (!rows || !rows.length) return;
    setStatus('syncing', '同步中');
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: USER_ID, items: rows })
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        d = unwrap(d);
        if (d && typeof d.maxTs === 'number') { lastTs = Math.max(lastTs, d.maxTs); online = true; setStatus('ok', '已同步'); }
        else { setStatus('error', '同步失败'); scheduleRetry(); }
      })
      .catch(function (e) {
        lastError = '推送失败: ' + (e && e.message ? e.message : '网络错误');
        online = false; setStatus('error', '同步失败'); scheduleRetry();
      });
  }
  function scheduleRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () { retryTimer = null; flush(); }, 8000);
  }

  /* ---------- 合并云端数据到本地（last-write-wins） ---------- */
  function applyItems(items, maxTs) {
    if (!items || !items.length) { if (typeof maxTs === 'number') lastTs = Math.max(lastTs, maxTs); setStatus(ready ? 'ok' : 'connecting', '已同步'); return; }
    var meta = getMeta();
    var changed = false, pulled = 0;
    items.forEach(function (row) {
      var localTs = meta[row.key] || 0;
      if (row.updated_at > localTs) {
        var str = (typeof row.value === 'string') ? row.value : JSON.stringify(row.value);
        _setItem.call(localStorage, row.key, str); // 用原始方法写，避免回推
        meta[row.key] = row.updated_at;
        changed = true; pulled++;
      }
      if (row.updated_at > lastTs) lastTs = row.updated_at;
    });
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
    if (typeof maxTs === 'number') lastTs = Math.max(lastTs, maxTs);
    if (changed) {
      setStatus('ok', '已同步 ' + pulled + ' 项');
      window.dispatchEvent(new CustomEvent('wb:remote', { detail: { reason: 'pull', count: pulled } }));
    } else {
      setStatus('ok', '已同步');
    }
  }

  /* ---------- 拉取云端增量 ---------- */
  function pullAll() {
    if (!ready) return;
    fetch(API + '?since=' + lastTs, { method: 'GET' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        d = unwrap(d);
        if (!d) { schedulePullRetry(); return; }
        pullRetryCount = 0;
        applyItems(d.items, d.maxTs);
      })
      .catch(function (e) {
        lastError = '拉取失败: ' + (e && e.message ? e.message : '请求失败');
        schedulePullRetry();
      });
  }
  function schedulePullRetry() {
    if (pullRetryTimer) clearTimeout(pullRetryTimer);
    pullRetryCount++;
    var delay = (pullRetryCount <= MAX_PULL_RETRIES)
      ? Math.min(2000 * Math.pow(2, pullRetryCount - 1), 30000) // 2,4,8,16,30s
      : 60000; // 超过常规次数后降级为每 60s 低频重试
    var label = (pullRetryCount <= MAX_PULL_RETRIES) ? '重试 ' + pullRetryCount + '/' + MAX_PULL_RETRIES : '等待重试';
    setStatus('connecting', label);
    pullRetryTimer = setTimeout(function () { pullRetryTimer = null; pullAll(); }, delay);
  }

  /* ---------- 删除同步 ---------- */
  function queueDelete(key) {
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: USER_ID, deletes: [key] })
    }).catch(function () {});
  }

  /* ---------- 老数据补时间戳（首次同步前，本地已有但未记录修改时间） ---------- */
  function seedLocalMeta() {
    var m = getMeta(); var changed = false;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (shouldSync(k) && typeof m[k] === 'undefined') { m[k] = Date.now(); changed = true; }
    }
    if (changed) try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
  }

  /* ---------- 全量推送（独立函数声明，确保 init() 调用时已提升） ---------- */
  function pushAll() {
    if (!ready) return;
    var meta = getMeta();
    var rows = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (shouldSync(k)) rows.push({ key: k, value: localStorage.getItem(k), updated_at: meta[k] || Date.now() });
    }
    if (rows.length) { setStatus('syncing', '推送 ' + rows.length + ' 项'); flushItems(rows); }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    ensureBadge();
    setStatus('connecting', '连接中');
    // 探测同源同步后端是否可用（纯静态部署无此 API 时降级为本地模式）
    fetch(API + '?since=0', { method: 'GET' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        d = unwrap(d);
        if (d && typeof d.maxTs !== 'undefined') {
          ready = true; online = true;
          seedLocalMeta();
          pullAll();   // 先拉云端全量到本地（last-write-wins）
          pushAll();   // 再把本地（含刚合并的）推上去，确保云端最新
          pollTimer = setInterval(pullAll, POLL_INTERVAL);
          window.wbSyncReady = true;
          window.dispatchEvent(new Event('wb:sync-ready'));
        } else {
          fallbackLocal();
        }
      })
      .catch(function (e) {
        lastError = '同步后端不可用: ' + (e && e.message ? e.message : '请求失败');
        fallbackLocal();
      });
    window.addEventListener('online', function () { if (ready) { online = true; flush(); } });
    window.addEventListener('offline', function () { online = false; setStatus('error', '离线'); });
  }
  function fallbackLocal() {
    ready = false; localOnly = true;
    setStatus('error', '未启用同步');
  }

  /* ---------- 公共 API ---------- */
  window.wbSync = {
    get enabled() { return ready; },
    get localOnly() { return localOnly; },
    get lastError() { return lastError; },
    get retryCount() { return pullRetryCount; },
    init: init,
    pushAll: pushAll,
    status: function () { return badge ? badge.className : ''; }
  };

  /* ---------- 代理 localStorage（必须在 app.js 之前执行） ---------- */
  var _setItem = localStorage.setItem.bind(localStorage);
  var _removeItem = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    var r = _setItem(key, value);
    if (shouldSync(key)) {
      setMetaTs(key, Date.now()); // 记录本地修改时间，作为 last-write-wins 依据
      if (ready) queuePush(key, value);
    }
    return r;
  };
  localStorage.removeItem = function (key) {
    var r = _removeItem(key);
    if (shouldSync(key) && ready) queueDelete(key);
    return r;
  };

  // 立即初始化（createClient 不需要 DOM，但探测需网络，异步进行）
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
