// 数据同步层：通过「微信云函数中转」访问网页后端，免备案、免配合法域名。
// 小程序只跟微信云函数通信，云函数再去打 Render 的 /api/sync；
// 网页后端一行都不用改，wb_lifecenter 同一份数据天然双向互通。
const CLOUD_FN = 'syncProxy';
const USER = 'edys-workbench';

function callCloud(action, value) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CLOUD_FN,
      data: { action: action, user_id: USER, value: value || null },
      success: res => {
        const r = (res && res.result) || {};
        if (r.error) return reject(new Error(r.error));
        resolve(r);
      },
      fail: err => reject(err)
    });
  });
}

// 把后端返回的 lc 统一解析为对象（后端存的是 JSON 字符串，也可能已是对象）
function parseLC(v) {
  if (v == null) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  return v;
}

// 读取全量生命周期数据（含今日任务 today[]、目标分支 branches[] 等）
function getLifeCenter() {
  return callCloud('get').then(r => {
    const lc = parseLC(r.lc);
    if (lc) return lc;
    // 首次使用（网页端尚未创建数据）给一份骨架，避免写回 null 损坏数据
    return { today: [], branches: [], watch: [], reminders: [], skips: [], _v: 2 };
  });
}

// 写回全量数据（沿用网页的 last-write-wins + updated_at 策略）
function saveLifeCenter(lc) {
  // 转成字符串再交给云函数，保证与后端存储格式一致（JSON 字符串）
  const payload = (typeof lc === 'string') ? lc : JSON.stringify(lc);
  return callCloud('save', payload).then(() => ({ ok: true }));
}

module.exports = { USER, getLifeCenter, saveLifeCenter };
