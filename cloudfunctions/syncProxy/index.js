// 微信云函数「syncProxy」：中转工作台数据，绕过小程序 request 合法域名/备案限制。
// 调用链：小程序 wx.cloud.callFunction('syncProxy') → 本云函数 → Render /api/sync → 返回 wb_lifecenter
// 云函数运行在服务端，访问海外 Render 不受微信域名备案限制；小程序侧完全无需备案。
const https = require('https');
const { URL } = require('url');

const API = 'https://life-workbench.onrender.com';
const USER = 'edys-workbench';
const TIMEOUT_MS = 12000;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, API);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
      timeout: TIMEOUT_MS
    };

    const req = https.request(opts, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { chunks += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(chunks || '{}'));
          } catch (e) {
            reject(new Error('JSON解析失败: ' + chunks));
          }
        } else {
          reject(new Error('后端返回 ' + res.statusCode + ': ' + chunks));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (data) req.write(data);
    req.end();
  });
}

exports.main = async (event) => {
  const userId = (event && event.user_id) || USER;
  const action = (event && event.action) || 'get';
  try {
    if (action === 'save') {
      await request('POST', '/api/sync?user_id=' + encodeURIComponent(userId), {
        user_id: userId,
        items: [{ key: 'wb_lifecenter', value: event.value, updated_at: Date.now() }]
      });
      return { ok: true };
    }
    // 默认 get
    // Render /api/sync 返回 {ok:true, data:{items:[...]}}，这里解包 data
    const d = await request('GET', '/api/sync?user_id=' + encodeURIComponent(userId));
    const items = (d && d.data && d.data.items) || (d && d.items) || [];
    const rec = items.find(i => i.key === 'wb_lifecenter');
    return { lc: rec ? rec.value : null };
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
};
