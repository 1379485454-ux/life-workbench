// 与网页工作台共用同一套后端同步接口，数据天然互通。
const API = 'https://life-workbench.onrender.com';
const USER = 'edys-workbench';

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API + path,
      method: method,
      data: data,
      header: { 'Content-Type': 'application/json' },
      success: res => resolve(res.data),
      fail: reject
    });
  });
}

// 读取全量生命周期数据（含今日任务 today[]、目标分支 branches[] 等）
function getLifeCenter() {
  return request('/api/sync?user_id=' + USER, 'GET').then(d => {
    const items = (d && d.items) || [];
    const rec = items.find(i => i.key === 'wb_lifecenter');
    return rec ? rec.value : null;
  });
}

// 写回全量数据（沿用网页的 last-write-wins + updated_at 策略）
function saveLifeCenter(lc) {
  return request('/api/sync', 'POST', {
    user_id: USER,
    items: [{ key: 'wb_lifecenter', value: lc, updated_at: Date.now() }]
  });
}

module.exports = { API, USER, getLifeCenter, saveLifeCenter };
