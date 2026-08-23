// 微信云函数「syncProxy」：中转工作台数据，绕过小程序 request 合法域名/备案限制。
// 调用链：小程序 wx.cloud.callFunction('syncProxy') → 本云函数 → Render /api/sync → 返回 wb_lifecenter
// 云函数运行在服务端，访问海外 Render 不受微信域名备案限制；小程序侧完全无需备案。
const API = 'https://life-workbench.onrender.com';
const USER = 'edys-workbench';

// 浏览器/云函数环境均兼容的 fetch（Node 18+ 云函数原生支持）
async function http(method, userId, body) {
  const url = API + '/api/sync?user_id=' + encodeURIComponent(userId);
  const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl ? ctrl.signal : undefined
    });
    if (!res.ok) throw new Error('后端返回 ' + res.status);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

exports.main = async (event) => {
  const userId = (event && event.user_id) || USER;
  const action = (event && event.action) || 'get';
  try {
    if (action === 'save') {
      await http('POST', userId, {
        user_id: userId,
        items: [{ key: 'wb_lifecenter', value: event.value, updated_at: Date.now() }]
      });
      return { ok: true };
    }
    // 默认 get
    const d = await http('GET', userId);
    const items = (d && d.items) || [];
    const rec = items.find(i => i.key === 'wb_lifecenter');
    return { lc: rec ? rec.value : null };
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
};
