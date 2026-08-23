const { getLifeCenter, saveLifeCenter } = require('../../utils/sync.js');

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const BRANCH = { life: '生活', study: '学习', work: '工作', extra: '偶发' };
const TOD = { morning: '上午', afternoon: '下午', evening: '晚上', anytime: '随时' };

function todayKey() {
  const d = new Date();
  const p = n => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function fmtDur(m) {
  if (!m) return '';
  return m >= 60 ? (Math.floor(m / 60) + '小时' + (m % 60 ? (m % 60) + '分' : '')) : m + '分';
}

Page({
  data: {
    dateLabel: '',
    tasks: [],
    done: 0,
    total: 0,
    pct: 0,
    addText: ''
  },

  onShow() {
    this.load();
  },

  load() {
    getLifeCenter().then(lc => {
      const tk = todayKey();
      const raw = (lc && lc.today) || [];
      const tasks = raw.filter(t => t.date === tk).map(t => ({
        id: t.id,
        text: t.text,
        done: !!t.done,
        branch: BRANCH[t.cat] || '生活',
        time: TOD[t.timeOfDay] || '随时',
        dur: fmtDur(t.duration)
      }));
      const done = tasks.filter(t => t.done).length;
      const total = tasks.length;
      const d = new Date();
      this.setData({
        dateLabel: (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + WEEK[d.getDay()],
        tasks,
        done,
        total,
        pct: total ? Math.round(done / total * 100) : 0
      });
    }).catch(() => {
      wx.showToast({ title: '加载失败，检查网络/域名', icon: 'none' });
    });
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id;
    getLifeCenter().then(lc => {
      const t = (lc.today || []).find(x => x.id === id);
      if (t) t.done = !t.done;
      return saveLifeCenter(lc);
    }).then(() => this.load()).catch(() => wx.showToast({ title: '保存失败', icon: 'none' }));
  },

  onInput(e) {
    this.setData({ addText: e.detail.value });
  },

  add() {
    const text = (this.data.addText || '').trim();
    if (!text) return;
    getLifeCenter().then(lc => {
      lc = lc || { today: [] };
      lc.today = lc.today || [];
      lc.today.push({
        id: 't' + Date.now(),
        text: text,
        cat: 'life',
        branchId: '',
        actionId: '',
        priority: 'mid',
        done: false,
        date: todayKey(),
        auto: false,
        timeOfDay: 'anytime',
        duration: 0
      });
      return saveLifeCenter(lc);
    }).then(() => {
      this.setData({ addText: '' });
      this.load();
    }).catch(() => wx.showToast({ title: '添加失败', icon: 'none' }));
  }
});
