/* ============================================
   个人工作台 v4 · 联网增强版
   核心改进：游戏化恢复 | 4模块联网 | 体验升级
   ============================================ */

// ===== 工具函数 =====
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const todayKey = () => new Date().toISOString().split('T')[0];
const daysBetween = (d1, d2) => Math.round((new Date(d2) - new Date(d1)) / 86400000);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const nowTime = () => new Date().toTimeString().slice(0, 5);
const nowDateTime = () => new Date().toISOString().slice(0,16).replace('T',' ');
const formatNum = (n) => n >= 10000 ? (n/10000).toFixed(1)+'万' : String(n);

function getDailyHistory(type, days) {
  const dates = lastNDays(days);
  return dates.map(date => ({ date, data: Store.get(`wb_${type}_${date}`, null) }));
}

// ===== SVG 图标 =====
const ICONS = {
  menu: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  home: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M3 12L12 3l9 9M5 10v10h14V10"/></svg>',
  plan: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
  read: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M2 4h7a3 3 0 013 3v13a2 2 0 00-2-2H2zM22 4h-7a3 3 0 00-3 3v13a2 2 0 012-2h8z"/></svg>',
  exercise: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M6 4v16M18 4v16M2 8v8M22 8v8M6 12h12"/></svg>',
  food: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M3 2v7a3 3 0 003 3v10M6 2v7M9 2v7M16 2c-2 0-3 3-3 6s1 4 3 4v10"/></svg>',
  finance: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
  media: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M3 11l18-7v16L3 13M11 11v6"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/></svg>',
  news: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/></svg>',
  drama: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>',
  knowledge: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M3 18V8l9-5 9 5v10M9 18v-6h6v6"/></svg>',
  review: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5"/></svg>',
  shop: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M3 9l1-5h16l1 5M5 9v11h14V9M9 14h6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 4H4v3a3 3 0 003 3M17 4h3v3a3 3 0 01-3 3"/></svg>',
  pomo: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  attr: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M12 2l2.4 5.9L21 9.2l-4.8 4.2L17.6 21 12 17.3 6.4 21l1.4-7.6L3 9.2l6.6-1.3L12 2z"/></svg>',
  report: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-9"/></svg>',
  backup: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>',
  coin: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 10.5h4a2 2 0 010 4h-4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5C12 20.5 4.5 14.8 4.5 9.2A3.7 3.7 0 0112 7a3.7 3.7 0 017.5 2.2c0 5.6-7.5 11.3-7.5 11.3z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.8 2.6 3.5 3.8 3.5 7.5A3.5 3.5 0 018.5 14a3.5 3.5 0 01-1-6.9c.6 1.6 2 2.1 3 1 .5-2 1.5-3.5 1.5-5.1z"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 01-.6-7.96 5 5 0 019.6-1.04A3.5 3.5 0 0117 18z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 019.5 4 7 7 0 1020 14.5z"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l2.3 5.7 6.2.5-4.7 4 1.5 6-5.3-3.2L6.4 20l1.5-6-4.7-4 6.2-.5z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s6.5-5.7 6.5-11A6.5 6.5 0 005.5 10c0 5.3 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h6v17H6a2 2 0 01-2-2zM20 5a2 2 0 00-2-2h-6v17h6a2 2 0 002-2z"/></svg>',
  run: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="5" r="2"/><path d="M13 9l-3 3 3 3 2 5M13 9l4 1 2 4M10 12l-2 4-2 3"/></svg>',
  target: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  medal: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><path d="M9 2l3 6 3-6M12 8v6"/></svg>',
  coffee: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13v5a4 4 0 01-4 4H8a4 4 0 01-4-4zM17 9h2a2 2 0 010 4h-2M7 2v2M11 2v2"/></svg>',
  tomato: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7"/><path d="M12 6V3M9.5 4l1.5 2M14.5 4l-1.5 2"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  water: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  notebook: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3 0 6 3 6 6 0 4-4 9-8 10-1-4-3-7-6-9 0-3 3-7 8-7z"/><circle cx="14.5" cy="9.5" r="1.5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  walk: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13 8l-3 4 3 3 1 5M10 12l-3 2-2 3M13 11l4 1 2 4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  archive: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M9 3v5h6V3M9 13h6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
};
const ICO = {
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>',
  chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5"/></svg>',
  external: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>',
  play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M7 4l13 8-13 8z"/></svg>',
  pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M8 5v14M16 5v14"/></svg>',
  save: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5zM8 3v6h7V3M8 21v-6h8v6"/></svg>',
  download: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>',
};

// ===== 菜单配置 =====
const MENU = [
  { id: 'home', name: '工作台首页', icon: ICONS.home, group: 'main' },
  { id: 'plan', name: '计划管理', icon: ICONS.plan, group: 'habit' },
  { id: 'read', name: '每日阅读', icon: ICONS.read, group: 'habit' },
  { id: 'exercise', name: '锻炼身体', icon: ICONS.exercise, group: 'habit' },
  { id: 'food', name: '好好吃饭', icon: ICONS.food, group: 'habit' },
  { id: 'finance', name: '理财记账', icon: ICONS.finance, group: 'habit' },
  { id: 'review', name: '每日复盘', icon: ICONS.review, group: 'habit' },
  { id: 'media', name: '自媒体计划', icon: ICONS.media, group: 'inspire' },
  { id: 'video', name: '爆款视频', icon: ICONS.video, group: 'inspire' },
  { id: 'news', name: '新闻热点', icon: ICONS.news, group: 'inspire' },
  { id: 'drama', name: '新剧分享', icon: ICONS.drama, group: 'inspire' },
  { id: 'knowledge', name: '理财知识', icon: ICONS.knowledge, group: 'inspire' },
  { id: 'pomo', name: '番茄专注', icon: ICONS.pomo, group: 'grow' },
  { id: 'shop', name: '奖励商店', icon: ICONS.shop, group: 'grow' },
  { id: 'achieve', name: '成就墙', icon: ICONS.trophy, group: 'grow' },
  { id: 'attributes', name: '个人属性', icon: ICONS.attr, group: 'grow' },
  { id: 'reports', name: '周报月报', icon: ICONS.report, group: 'grow' },
  { id: 'backup', name: '数据备份', icon: ICONS.backup, group: 'sys' },
  { id: 'settings', name: '设置', icon: ICONS.settings, group: 'sys' },
];
const GROUP_NAMES = { habit: '每日习惯', inspire: '灵感资讯', grow: '成长系统', sys: '数据与系统' };

// ===== 存储层 =====
const Store = {
  get(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); },
  getDaily(type, def) { return Store.get(`wb_${type}_${todayKey()}`, def); },
  setDaily(type, val) { Store.set(`wb_${type}_${todayKey()}`, val); },
};

// ===== 用户资料（可配置昵称/头像） =====
const UserProfile = {
  key: 'wb_user_profile',
  defaults: { name: '我', avatar: '', title: '', avatarEmoji: '', accent: '' },
  get() {
    const saved = Store.get(this.key, null);
    return saved && typeof saved === 'object' ? { ...this.defaults, ...saved } : { ...this.defaults };
  },
  set(patch) { Store.set(this.key, { ...this.get(), ...patch }); },
  get displayName() { return this.get().name || this.defaults.name; },
  get initials() {
    const name = this.displayName;
    if (!name) return 'ME';
    // 中文取首字
    if (/[\u4e00-\u9fa5]/.test(name)) return name.trim().slice(0, 1);
    // 英文多空格取首字母
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }
};

// ===== 个人自由个性化（无金币、无解锁门禁） =====
const ACCENT_PRESETS = {
  sky:    { primary: '#0EA5E9', dark: '#0284C7', light: '#38BDF8', name: '天蓝' },
  ocean:  { primary: '#2563EB', dark: '#1D4ED8', light: '#60A5FA', name: '海蓝' },
  teal:   { primary: '#0D9488', dark: '#0F766E', light: '#2DD4BF', name: '青碧' },
  violet: { primary: '#7C3AED', dark: '#6D28D9', light: '#A78BFA', name: '紫罗兰' },
  rose:   { primary: '#E11D48', dark: '#BE123C', light: '#FB7185', name: '玫瑰' },
  amber:  { primary: '#D97706', dark: '#B45309', light: '#FBBF24', name: '暖琥珀' },
};
function applyPersonalization() {
  const p = UserProfile.get();
  const root = document.documentElement;
  const a = p.accent && ACCENT_PRESETS[p.accent] ? ACCENT_PRESETS[p.accent] : ACCENT_PRESETS.sky;
  root.style.setProperty('--primary', a.primary);
  root.style.setProperty('--primary-dark', a.dark);
  root.style.setProperty('--primary-light', a.light);
  root.style.setProperty('--sidebar-active', a.primary);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', a.primary);
  const av = document.getElementById('headerAvatar');
  if (av) { av.textContent = p.avatarEmoji || UserProfile.initials; av.title = UserProfile.displayName + (p.title ? (' · ' + p.title) : ''); }
}

// 个人属性图标 (内联 SVG, UI/UX: 避免 emoji)
const ATTR_ICONS = {
  strength: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9l-2 3 2 3M20 9l2 3-2 3M6.5 6.5l11 11M6.5 17.5l11-11M9 4l3-2 3 2M9 20l3 2 3-2"/></svg>',
  intelligence: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.5c.5.4 1 1 1 1.8h5c0-.8.5-1.4 1-1.8A6 6 0 0012 3z"/></svg>',
  charisma: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.8L19 9l-5.2 1.2L12 15l-1.8-4.8L5 9l5.2-1.2z"/></svg>',
  creativity: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2 0-.8-.5-1-1-2s1.5-1.5 2.5-1c1.5-1 2-3 1-4.5A9 9 0 0012 3zM8 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
  discipline: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
};

// ===== 游戏化系统 (LifeUp 风格 RPG 属性) =====
const ATTRIBUTES = [
  { key: 'strength', name: '体力', icon: ATTR_ICONS.strength, color: '#ef4444', desc: '运动锻炼' },
  { key: 'intelligence', name: '智力', icon: ATTR_ICONS.intelligence, color: '#3b82f6', desc: '阅读学习' },
  { key: 'charisma', name: '魅力', icon: ATTR_ICONS.charisma, color: '#ec4899', desc: '社交生活' },
  { key: 'creativity', name: '创造力', icon: ATTR_ICONS.creativity, color: '#8b5cf6', desc: '创作输出' },
  { key: 'discipline', name: '自律', icon: ATTR_ICONS.discipline, color: '#f59e0b', desc: '完成任务' },
];
const Game = {
  data: null,
  init() {
    this.data = Store.get('wb_user', {
      level: 1, exp: 0, expMax: 100, coins: 50,
      health: 100, healthMax: 100,
      streak: 0, lastCheckIn: null, lastActive: null,
      totalCheckIns: 0, totalTasksDone: 0,
      checkInDates: [],
      joinDate: todayKey(),
      attributes: { strength:{lv:1,exp:0}, intelligence:{lv:1,exp:0}, charisma:{lv:1,exp:0}, creativity:{lv:1,exp:0}, discipline:{lv:1,exp:0} },
      pomodoros: 0,
      achievements: [],
      shopPurchases: [],
    });
    if (!this.data.healthReset) { this.data.health = 100; this.data.healthReset = true; this.save(); }
    if (!this.data.attributes) { this.data.attributes = { strength:{lv:1,exp:0}, intelligence:{lv:1,exp:0}, charisma:{lv:1,exp:0}, creativity:{lv:1,exp:0}, discipline:{lv:1,exp:0} }; this.save(); }
    if (!this.data.pomodoros) this.data.pomodoros = 0;
    if (!this.data.achievements) this.data.achievements = [];
    if (!this.data.shopPurchases) this.data.shopPurchases = [];
    this.dailyCheck();
    this.checkAchievements();
  },
  save() { Store.set('wb_user', this.data); },
  dailyCheck() {
    const today = todayKey();
    if (this.data.lastActive !== today) {
      if (this.data.lastActive) {
        const diff = daysBetween(this.data.lastActive, today);
        if (diff > 1) { this.data.streak = 0; this.data.health = Math.max(20, this.data.health - 10); }
      }
      this.data.lastActive = today;
      this.save();
    }
  },
  addExp(n) {
    this.data.exp += n;
    while (this.data.exp >= this.data.expMax) {
      this.data.exp -= this.data.expMax;
      this.data.level++;
      this.data.expMax = Math.floor(this.data.expMax * 1.25);
      this.data.health = Math.min(this.data.healthMax, this.data.health + 10);
      toast(`${ICONS.sparkles} 升级！Lv.${this.data.level}`, 'success');
    }
    this.save();
  },
  addCoins(n) { this.data.coins += n; this.save(); },
  addHealth(n) { this.data.health = Math.min(this.data.healthMax, Math.max(0, this.data.health + n)); this.save(); },
  addTaskDone() { this.data.totalTasksDone++; this.save(); },
  addAttrExp(attr, exp) {
    if (!attr || !this.data.attributes[attr]) return;
    const a = this.data.attributes[attr];
    a.exp += exp;
    const need = a.lv * 50;
    while (a.exp >= need) { a.exp -= need; a.lv++; toast(`${ATTRIBUTES.find(x=>x.key===attr).icon} ${ATTRIBUTES.find(x=>x.key===attr).name} 升级！Lv.${a.lv}`, 'success'); }
    this.save();
  },
  reward(exp, coins, health, attr) {
    this.addExp(exp);
    this.addCoins(coins);
    if (health) this.addHealth(health);
    if (attr) this.addAttrExp(attr, Math.floor(exp * 0.8));
    this.renderSidebar();
    if (exp > 0 || coins > 0 || health > 0) this.showReward(exp, coins, health, attr);
    this.checkAchievements();
  },
  showReward(exp, coins, health, attr) {
    const el = document.createElement('div');
    el.className = 'reward-popup';
    const attrInfo = attr ? ATTRIBUTES.find(a => a.key === attr) : null;
    el.innerHTML = `<div class="reward-pop-icon">${ICONS.sparkles}</div><div class="reward-pop-items">${exp?`<span>+${exp} EXP</span>`:''}${coins?`<span>+${coins} ${ICONS.coin}</span>`:''}${health?`<span>+${health} ${ICONS.heart}</span>`:''}${attrInfo?`<span style="color:${attrInfo.color}">+${attrInfo.icon} ${attrInfo.name}</span>`:''}</div>`;
    $('#toastContainer').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 400); }, 1800);
  },
  checkIn() {
    const today = todayKey();
    if (this.data.lastCheckIn === today) return { ok: false, msg: '今天已经打卡啦！' };
    if (this.data.lastCheckIn) {
      const diff = daysBetween(this.data.lastCheckIn, today);
      this.data.streak = diff === 1 ? this.data.streak + 1 : 1;
    } else { this.data.streak = 1; }
    this.data.lastCheckIn = today;
    this.data.totalCheckIns++;
    if (!this.data.checkInDates) this.data.checkInDates = [];
    this.data.checkInDates.push(today);
    this.save();
    this.reward(30, 15, 5);
    return { ok: true };
  },
  hasCheckedInToday() { return this.data.lastCheckIn === todayKey(); },
  isCheckedIn(date) { return (this.data.checkInDates || []).includes(date); },
  checkAchievements() {
    const d = this.data;
    const unlocked = d.achievements || [];
    const tryUnlock = (id, name, desc, icon) => {
      if (!unlocked.find(a => a.id === id)) { unlocked.push({ id, name, desc, icon, date: todayKey() }); d.achievements = unlocked; this.save(); toast(`${ICONS.medal} 成就解锁: ${name}！`, 'success'); }
    };
    if (d.totalCheckIns >= 1) tryUnlock('first_checkin', '初心者', '完成第一次打卡', '📍');
    if (d.totalCheckIns >= 7) tryUnlock('week_streak', '一周坚持', '累计打卡 7 天', '🔥');
    if (d.totalCheckIns >= 30) tryUnlock('month_streak', '月度达人', '累计打卡 30 天', '📅');
    if (d.totalCheckIns >= 100) tryUnlock('centurion', '百日传奇', '累计打卡 100 天', '💯');
    if (d.totalTasksDone >= 10) tryUnlock('task_10', '初出茅庐', '完成 10 个任务', '📋');
    if (d.totalTasksDone >= 50) tryUnlock('task_50', '任务达人', '完成 50 个任务', '⚡');
    if (d.totalTasksDone >= 200) tryUnlock('task_200', '任务终结者', '完成 200 个任务', '🏆');
    if (d.level >= 5) tryUnlock('lv5', '小有所成', '等级达到 5 级', '⭐');
    if (d.level >= 10) tryUnlock('lv10', '渐入佳境', '等级达到 10 级', '🌟');
    if (d.level >= 20) tryUnlock('lv20', '大师之路', '等级达到 20 级', '👑');
    if (d.coins >= 500) tryUnlock('rich_500', '小富翁', '累计获得 500 金币', '💰');
    if (d.coins >= 2000) tryUnlock('rich_2000', '财大气粗', '累计获得 2000 金币', '💎');
    if (d.pomodoros >= 1) tryUnlock('first_pomo', '番茄新手', '完成第一个番茄钟', '🍅');
    if (d.pomodoros >= 25) tryUnlock('pomo_25', '番茄大师', '完成 25 个番茄钟', '🥇');
    // Check attribute levels
    ATTRIBUTES.forEach(a => {
      const ad = d.attributes[a.key];
      if (ad && ad.lv >= 5) tryUnlock(`attr_${a.key}_5`, `${a.name}达人`, `${a.name}达到 5 级`, a.icon);
      if (ad && ad.lv >= 10) tryUnlock(`attr_${a.key}_10`, `${a.name}大师`, `${a.name}达到 10 级`, a.icon);
    });
    // Check reading
    const readHistory = Store.get('wb_reading_history', []);
    const totalPages = readHistory.reduce((s, h) => s + (h.pages || 0), 0);
    if (totalPages >= 100) tryUnlock('read_100', '百页读者', '累计阅读 100 页', '📖');
    if (totalPages >= 1000) tryUnlock('read_1000', '千页书虫', '累计阅读 1000 页', '📚');
    // Check exercise
    let exCount = 0;
    lastNDays(60).forEach(date => { const ex = Store.get(`wb_exercise_${date}`); if (ex) exCount += (ex.workouts || []).length + (ex.medMinutes > 0 ? 1 : 0); });
    if (exCount >= 10) tryUnlock('ex_10', '运动新手', '完成 10 次锻炼', '💪');
    if (exCount >= 50) tryUnlock('ex_50', '运动达人', '完成 50 次锻炼', '🏃');
  },
  renderSidebar() {
    const d = this.data;
    const expPct = (d.exp / d.expMax * 100).toFixed(0);
    const attrHtml = ATTRIBUTES.map(a => {
      const ad = d.attributes[a.key] || { lv: 1, exp: 0 };
      const need = ad.lv * 50;
      const pct = (ad.exp / need * 100).toFixed(0);
      return `
        <div class="sg-attr" title="${a.name} Lv.${ad.lv}">
          <div class="sg-attr-icon" style="color:${a.color}">${a.icon}</div>
          <div class="sg-attr-info">
            <div class="sg-attr-name">${a.name}</div>
            <div class="sg-attr-bar"><div class="sg-attr-fill" style="width:${pct}%;background:${a.color}"></div></div>
          </div>
          <div class="sg-attr-lv">${ad.lv}</div>
        </div>`;
    }).join('');
    $('#sidebarStats').innerHTML = `
      <div class="sidebar-game">
        <div class="sg-header">
          <div class="sg-avatar-wrap">
            <div class="sg-avatar">${d.level}</div>
            <svg class="sg-ring" viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="var(--bg-light)" stroke-width="4"/>
              <circle cx="20" cy="20" r="18" fill="none" stroke="url(#sgRingGrad)" stroke-width="4"
                stroke-dasharray="${(expPct/100*113.1).toFixed(1)} ${((100-expPct)/100*113.1).toFixed(1)}" stroke-linecap="round" transform="rotate(-90 20 20)"/>
              <defs><linearGradient id="sgRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0EA5E9"/></linearGradient></defs>
            </svg>
          </div>
          <div class="sg-meta">
            <div class="sg-name-row">
              <span class="sg-lv">Lv.${d.level}</span>
              <span class="sg-name">${UserProfile.displayName}</span>
            </div>
            <div class="sg-resources">
              <span class="sg-res sg-coin" title="金币">${ICONS.coin}<b>${d.coins}</b></span>
              <span class="sg-res sg-hp" title="生命值">${ICONS.heart}<b>${d.health}</b></span>
              <span class="sg-res sg-streak" title="连续打卡">${ICONS.flame}<b>${d.streak}</b></span>
            </div>
          </div>
        </div>
        <div class="sg-expbar">
          <div class="sg-expbar-fill" style="width:${expPct}%"></div>
          <span class="sg-expbar-text">${d.exp}/${d.expMax} EXP</span>
        </div>
        <div class="sg-attrs">${attrHtml}</div>
        <div class="sg-footer">
          <span class="sg-stat">${ICONS.check}<b>${d.totalCheckIns}</b>打卡</span>
          <span class="sg-stat">${ICONS.list}<b>${d.totalTasksDone}</b>任务</span>
          <span class="sg-stat">${ICONS.tomato}<b>${d.pomodoros}</b>番茄</span>
        </div>
      </div>`;
  },
};

// ===== API 客户端 (联网数据) =====
const API = {
  _cache: {},
  async _fetch(url, key, ttl = 5 * 60 * 1000) {
    const c = this._cache[key];
    if (c && Date.now() - c.ts < ttl) return c.data;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || '请求失败');
    this._cache[key] = { data: json.data, ts: Date.now() };
    return json.data;
  },
  news() { return this._fetch('/api/news', 'news'); },
  videos() { return this._fetch('/api/videos', 'videos'); },
  douyin() { return this._fetch('/api/douyin', 'douyin'); },
  dramas() { return this._fetch('/api/dramas', 'dramas'); },
  movies() { return this._fetch('/api/movies', 'movies'); },
  books() { return this._fetch('/api/books', 'books'); },
  finance() { return this._fetch('/api/finance', 'finance'); },
  refresh() { this._cache = {}; return fetch('/api/refresh').then(r => r.json()); },
  wereadShelf() {
    const cookie = Store.get('wb_weread_cookie', '');
    if (!cookie) return Promise.reject(new Error('请先配置微信读书 Cookie'));
    return fetch('/api/weread/shelf', { headers: { 'X-Weread-Cookie': cookie } })
      .then(r => r.json())
      .then(j => { if (!j.ok) throw new Error(j.error); return j.data; });
  },
  wereadStats() {
    const cookie = Store.get('wb_weread_cookie', '');
    if (!cookie) return Promise.reject(new Error('请先配置微信读书 Cookie'));
    return fetch('/api/weread/stats', { headers: { 'X-Weread-Cookie': cookie } })
      .then(r => r.json())
      .then(j => { if (!j.ok) throw new Error(j.error); return j.data; });
  },
};

// ===== 每日激励语 =====
const QUOTES = [
  { cn: '千里之行，始于足下。', en: 'A journey of a thousand miles begins with a single step.' },
  { cn: '不积跬步，无以至千里；不积小流，无以成江海。', en: 'Great achievements are built step by step, drop by drop.' },
  { cn: '今天的努力，是明天最好的礼物。', en: "Today's effort is tomorrow's best gift." },
  { cn: '星光不问赶路人，时光不负有心人。', en: 'The stars do not question the traveler; time does not fail the diligent.' },
  { cn: '你现在的努力，是未来你感谢自己的理由。', en: 'Your current effort is the reason your future self will thank you.' },
  { cn: '每一个不曾起舞的日子，都是对生命的辜负。', en: 'Every day lived without passion is a betrayal of life itself.' },
  { cn: '种一棵树最好的时间是十年前，其次是现在。', en: 'The best time to plant a tree was 20 years ago. The second best time is now.' },
  { cn: '不要等到万事俱备，有了七成把握就行动。', en: "Don't wait for perfection. Act when you are 70% ready." },
  { cn: '所有的伟大，都源于一个勇敢的开始。', en: 'All greatness begins with a brave start.' },
  { cn: '自律给我自由。', en: 'Self-discipline is the path to freedom.' },
  { cn: '与其临渊羡鱼，不如退而结网。', en: 'Instead of envying others, take action to improve yourself.' },
  { cn: '没有人能替你坚强，你必须自己成长。', en: 'No one can be strong for you; you must grow on your own.' },
  { cn: '你若盛开，蝴蝶自来。', en: 'When you bloom, the butterflies will come.' },
  { cn: '把每一天当作生命的第一天来过。', en: 'Live every day as if it were the first day of your life.' },
  { cn: '真正的强者不是没有眼泪，而是含着眼泪奔跑。', en: 'The strong are not tearless; they run with tears in their eyes.' },
  { cn: '世界那么大，你的野心一定要更大。', en: 'The world is vast; let your ambition be vaster.' },
  { cn: '不怕慢，就怕站。', en: 'Better to crawl than to stand still.' },
  { cn: '你的人生不会辜负你的每一滴汗水。', en: 'Life will not betray every drop of your sweat.' },
  { cn: '心若没有栖息的地方，到哪里都是流浪。', en: 'Without a place for your heart to rest, you wander everywhere.' },
  { cn: '今天是你余生中最年轻的一天。', en: 'Today is the youngest day of the rest of your life.' },
  { cn: '坚持是一种信仰，专注是一种力量。', en: 'Persistence is faith; focus is power.' },
  { cn: '梦想不会逃跑，逃跑的永远是自己。', en: 'Dreams do not run away; it is you who runs.' },
  { cn: '能力是练出来的，潜能是逼出来的。', en: 'Ability is trained; potential is forced out.' },
  { cn: '越努力越幸运。', en: 'The harder you work, the luckier you get.' },
  { cn: '做正确的事，等待时间的发生。', en: 'Do the right things and let time do the rest.' },
  { cn: '不逼自己一把，你永远不知道自己有多优秀。', en: 'You will never know how good you are until you push yourself.' },
  { cn: '成长就是把哭声调成静音的过程。', en: 'Growing up is the process of turning your tears on mute.' },
  { cn: '当你停止尝试时，就是失败的时候。', en: 'You fail the moment you stop trying.' },
  { cn: '微小的习惯，会带来巨大的改变。', en: 'Small habits lead to massive change.' },
  { cn: '路虽远，行则将至；事虽难，做则可成。', en: 'The road is long, but you arrive by walking.' },
  { cn: '日拱一卒无有尽，功不唐捐终入海。', en: 'Daily small efforts are never in vain; they eventually become an ocean.' },
];
const getTodayQuote = () => QUOTES[(new Date().getDate() - 1) % QUOTES.length];

// ===== Toast =====
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = msg;
  $('#toastContainer').appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, 2500);
}

// 发现 Service Worker 新版本时，显示可点击的刷新提示条（根治"手机端更新不可见"）
function showSWUpdateBar() {
  if (document.getElementById('swUpdateBar')) return;
  const bar = document.createElement('div');
  bar.id = 'swUpdateBar';
  bar.innerHTML = ICONS.sparkles + ' 发现新版本，点击立即更新';
  bar.addEventListener('click', () => location.reload());
  document.body.appendChild(bar);
}

// ===== UI: 通用编辑弹窗 =====
const UI = {
  modalEl: null,
  editModal({ title, icon = ICO.edit, fields, values, onSave, onDelete, saveLabel = '保存' }) {
    this.closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) this.closeModal(); });
    const bodyHtml = fields.map(f => {
      const val = values[f.key] ?? '';
      if (f.type === 'select') return `<div class="modal-field"><label>${f.label}</label><select id="modal_${f.key}">${f.options.map(o => `<option value="${o.value}" ${String(o.value)===String(val)?'selected':''}>${o.label}</option>`).join('')}</select></div>`;
      if (f.type === 'textarea') return `<div class="modal-field"><label>${f.label}</label><textarea id="modal_${f.key}" placeholder="${f.placeholder||''}" ${f.minHeight?`style="min-height:${f.minHeight}px"`:''}>${esc(val)}</textarea></div>`;
      const attrs = [f.type === 'number' ? `type="number" step="${f.step||'1'}" min="${f.min??''}" max="${f.max??''}"` : `type="${f.type||'text'}"`, `value="${esc(val)}"`, f.placeholder ? `placeholder="${f.placeholder}"` : ''].join(' ');
      return `<div class="modal-field"><label>${f.label}</label><input id="modal_${f.key}" ${attrs}></div>`;
    }).join('');
    overlay.innerHTML = `<div class="modal"><div class="modal-header"><div class="modal-title">${icon} ${esc(title)}</div><button class="modal-close" onclick="UI.closeModal()">✕</button></div><div class="modal-body">${bodyHtml}</div><div class="modal-footer">${onDelete ? `<button class="btn btn-danger btn-sm" id="modalDeleteBtn">${ICO.trash} 删除</button>` : ''}<div class="modal-footer-right"><button class="btn btn-outline btn-sm" onclick="UI.closeModal()">取消</button><button class="btn btn-primary btn-sm" id="modalSaveBtn">${saveLabel}</button></div></div></div>`;
    document.body.appendChild(overlay);
    this.modalEl = overlay;
    $('#modalSaveBtn').addEventListener('click', () => {
      const nv = {}; fields.forEach(f => { const el = $(`#modal_${f.key}`); nv[f.key] = f.type === 'number' ? parseFloat(el.value) || 0 : el.value.trim(); });
      this.closeModal(); onSave(nv);
    });
    if (onDelete) $('#modalDeleteBtn').addEventListener('click', () => { this.closeModal(); onDelete(); });
    const firstInput = overlay.querySelector('input, textarea, select');
    if (firstInput) firstInput.focus();
    overlay.querySelectorAll('input').forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') $('#modalSaveBtn').click(); }));
  },
  confirm(message, onConfirm, { confirmText = '确认删除', danger = true } = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.innerHTML = `<div class="confirm-box"><div class="confirm-icon">⚠️</div><div class="confirm-message">${esc(message)}</div><div class="confirm-buttons"><button class="btn btn-outline btn-sm" id="confirmCancel">取消</button><button class="btn ${danger?'btn-danger':'btn-primary'} btn-sm" id="confirmOk">${confirmText}</button></div></div>`;
    document.body.appendChild(overlay);
    $('#confirmCancel').addEventListener('click', () => overlay.remove());
    $('#confirmOk').addEventListener('click', () => { overlay.remove(); onConfirm(); });
    $('#confirmOk').focus();
  },
  closeModal() { if (this.modalEl) { this.modalEl.remove(); this.modalEl = null; } },
};

// ===== 视觉特效工具 (v9) =====
function confetti(x, y, count = 40) {
  const layer = $('#confettiLayer'); if (!layer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#60a5fa', '#3b82f6', '#7c3aed', '#f59e0b', '#10b981', '#ec4899', '#fbbf24', '#22d3ee'];
  const H = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const spread = 60 + Math.random() * Math.max(window.innerWidth, H) * 0.55;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', (Math.cos(angle) * spread * 0.5).toFixed(0) + 'px');
    p.style.setProperty('--dy', (H * 0.7 + Math.random() * H * 0.55).toFixed(0) + 'px');
    p.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    p.style.setProperty('--dur', (1.8 + Math.random() * 1.5).toFixed(2) + 's');
    layer.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}

// ===== 骨架屏占位 (v9) =====
function skelNews(n = 8) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const w2 = 30 + Math.floor(Math.random() * 40);
    s += `<div class="skel-news"><div class="skeleton sk-rank"></div><div class="sk-body"><div class="skeleton sk-line w1"></div><div class="skeleton sk-line" style="width:${w2}%"></div></div></div>`;
  }
  return s;
}
function skelGrid(n = 6) {
  let s = '<div class="skel-grid">';
  for (let i = 0; i < n; i++) s += `<div class="skeleton skel-card"></div>`;
  return s + '</div>';
}

// ===== 按钮水波纹 (v9) =====
function attachRipple() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    if (btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }, true);
}

// ===== 导航 =====
const Sidebar = {
  _scrollY: 0,
  open() {
    const sb = $('#sidebar');
    if (!sb) return;
    // iOS 安全区 body scroll lock：记录当前滚动位置并固定 body，而不是粗暴 overflow:hidden
    this._scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this._scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    sb.classList.add('open');
    let overlay = $('#sidebarOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.className = 'sidebar-overlay';
      overlay.onclick = () => Sidebar.close();
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
  },
  close() {
    const sb = $('#sidebar');
    if (sb) sb.classList.remove('open');
    const overlay = $('#sidebarOverlay');
    if (overlay) overlay.classList.remove('show');
    // 恢复 body 滚动
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (this._scrollY > 0) {
      window.scrollTo(0, this._scrollY);
      this._scrollY = 0;
    }
  },
  toggle() {
    const sb = $('#sidebar');
    if (sb && sb.classList.contains('open')) this.close(); else this.open();
  }
};

const Nav = {
  current: 'home',
  scrollPositions: {},
  isMobile: function() { return window.innerWidth <= 768; },
  init() {
    this.renderNav();
    window.addEventListener('resize', () => { this.renderNav(); });
  },
  renderNav() {
    const nav = $('#sidebarNav');
    // 统一侧边栏抽屉：完整菜单 + 分组标题
    let html = '', lastGroup = null;
    MENU.forEach((m, i) => {
      if (m.group !== lastGroup && m.group !== 'main') {
        html += `<div class="nav-group-title">${GROUP_NAMES[m.group] || m.group}</div>`;
        lastGroup = m.group;
      }
      html += `<button class="nav-item ${m.id === this.current ? 'active' : ''}" data-module="${m.id}">${m.icon}<span>${m.name}</span></button>`;
    });
    nav.innerHTML = html;
    nav.onclick = (e) => {
      const btn = e.target.closest('.nav-item');
      if (!btn || !btn.dataset.module) return;
      this.switchTo(btn.dataset.module);
      Sidebar.close();
    };
  },
  switchTo(id) {
    if (this.current) this.scrollPositions[this.current] = $('#content').scrollTop;
    this.current = id;
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.module === id));
    const mod = MENU.find(m => m.id === id);
    $('#mainHeader').innerHTML = `<div class="header-left"><button class="header-menu-btn" id="menuToggle" onclick="Sidebar.toggle()" title="打开菜单" aria-label="菜单">${ICONS.menu}</button><div class="header-title-wrap"><div class="header-greeting" id="headerGreeting">你好</div><div class="header-title">${mod.icon} ${mod.name}</div></div></div><div class="header-right"><span class="header-date" id="headerDate">${ICONS.calendar}<span class="header-date-text"></span></span><button class="header-theme-toggle" id="themeToggle" onclick="Theme.toggle()" title="切换亮色/暗色">${Theme.current === 'dark' ? ICONS.sun : ICONS.moon}</button><div class="header-avatar" id="headerAvatar" title="${UserProfile.displayName}">${UserProfile.initials}</div></div>`;
    const renderer = Modules[id];
    $('#content').innerHTML = renderer ? renderer() : '<div class="empty-state"><div class="empty-state-icon">'+ICONS.target+'</div><div class="empty-state-text">功能开发中...</div></div>';
    if (ModuleHooks[id]) ModuleHooks[id]();
    Clock.tick();
    $('#content').scrollTop = this.scrollPositions[id] || 0;
  },
  refresh() {
    const id = this.current;
    const scrollPos = $('#content').scrollTop;
    const renderer = Modules[id];
    if (renderer) { $('#content').innerHTML = renderer(); if (ModuleHooks[id]) ModuleHooks[id](); $('#content').scrollTop = scrollPos; }
    Clock.tick();
  },
};

// ===== 时钟 =====
const Clock = {
  timer: null, lastDay: null,
  start() { this.tick(); this.timer = setInterval(() => this.tick(), 1000); },
  tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0'), m = String(now.getMinutes()).padStart(2, '0'), s = String(now.getSeconds()).padStart(2, '0');
    const elT = $('#dashClockTime'); if (elT) elT.textContent = `${h}:${m}:${s}`;
    const wk = ['日','一','二','三','四','五','六'][now.getDay()];
    const elD = $('#dashClockDate'); if (elD) elD.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${wk}`;
    const elH = document.getElementById('headerDateText'); if (elH) elH.textContent = `${now.getMonth()+1}月${now.getDate()}日 星期${wk}`;
    const hr = now.getHours();
    const greet = hr < 6 ? '凌晨好' : hr < 12 ? '早上好' : hr < 14 ? '中午好' : hr < 18 ? '下午好' : hr < 22 ? '晚上好' : '夜深了';
    const name = UserProfile.displayName;
    const elG = $('#headerGreeting'); if (elG) elG.textContent = `${greet}，${name}`;
    const elHG = $('#dashHeroGreet'); if (elHG) elHG.textContent = `${greet}，${name} 今天也要元气满满`;
    if (this.lastDay !== now.getDate()) { this.lastDay = now.getDate(); if (this.lastDay !== undefined && Nav.current === 'home') { Game.dailyCheck(); Nav.switchTo('home'); } }
  },
};

// ===== 主题 (亮色 / 暗色) =====
const Theme = {
  key: 'wb_theme',
  current: 'light',
  init() {
    const saved = Store.get(this.key, null);
    let theme = saved;
    if (!theme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    this.apply(theme, false);
  },
  apply(theme, persist = true) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    if (persist) Store.set(this.key, theme);
  },
  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
    toast(this.current === 'dark' ? '已切换到暗色模式' : '已切换到亮色模式', 'success');
  },
};

// ===== 模块渲染器 =====
const Modules = {};
const ModuleHooks = {};

// ===== 首页自定义布局（纯个人偏好，无解锁/奖励） =====
const HOME_LAYOUT_DEFAULT = {
  rings: ['task', 'water', 'exercise', 'read'],
  hiddenRings: [],
  sections: { overview: true, streak: true, quote: true },
};
const HomeLayout = {
  get() {
    const s = Store.get('wb_home_layout', null);
    if (s && Array.isArray(s.rings)) {
      // 容错：补齐缺失字段
      return {
        rings: s.rings.filter(k => ['task','water','exercise','read'].includes(k)),
        hiddenRings: Array.isArray(s.hiddenRings) ? s.hiddenRings : [],
        sections: Object.assign({}, HOME_LAYOUT_DEFAULT.sections, s.sections || {}),
      };
    }
    return JSON.parse(JSON.stringify(HOME_LAYOUT_DEFAULT));
  },
  set(v) { Store.set('wb_home_layout', v); },
  reset() { Store.set('wb_home_layout', JSON.parse(JSON.stringify(HOME_LAYOUT_DEFAULT))); },
};

// ---------- 首页 ----------
Modules.home = () => {
  const q = getTodayQuote();
  const checkedIn = Game.hasCheckedInToday();
  const d = Game.data;
  const todayTasks = Store.getDaily('plan', []);
  const doneTasks = todayTasks.filter(t => t.done).length;
  const taskPct = todayTasks.length ? (doneTasks / todayTasks.length * 100) : 0;
  const todayExercise = Store.getDaily('exercise', { medMinutes: 0, workouts: [] });
  const exMin = todayExercise.medMinutes + todayExercise.workouts.reduce((s,w)=>s+(w.minutes||0), 0);
  const todayWater = Store.getDaily('food', { meals: [], water: 0 });
  const waterPct = Math.min(100, (todayWater.water || 0) / 8 * 100);
  const todayRead = Store.getDaily('reading', { pages: 0, minutes: 0 });
  const readGoal = Store.get('wb_reading_goal', 30);
  const readPct = Math.min(100, (todayRead.pages || 0) / readGoal * 100);

  const dates7 = lastNDays(7);
  const dayNames = ['日','一','二','三','四','五','六'];
  const calHtml = dates7.map((date, i) => {
    const dt = new Date(date), checked = Game.isCheckedIn(date), isToday = i === 6;
    return `<div class="streak-day ${checked?'checked':''} ${isToday?'today':''}"><div class="streak-day-name">${dayNames[dt.getDay()]}</div><div class="streak-day-icon">${checked ? ICONS.check : (isToday ? ICONS.pin : '○')}</div><div class="streak-day-date">${dt.getMonth()+1}/${dt.getDate()}</div></div>`;
  }).join('');

  const layout = HomeLayout.get();
  const RING_DEFS = {
    task:     { pct: taskPct, opt: { size: 96, stroke: 8, color: '#3b82f6', label: `${doneTasks}`, sub: `/${todayTasks.length} 任务` }, label: `${ICONS.list} 今日计划` },
    water:    { pct: waterPct, opt: { size: 96, stroke: 8, color: '#06b6d4', label: `${todayWater.water||0}`, sub: `/8 杯水` }, label: `${ICONS.water} 好好喝水` },
    exercise: { pct: Math.min(100, exMin / 30 * 100), opt: { size: 96, stroke: 8, color: '#f59e0b', label: `${exMin}`, sub: `分钟运动` }, label: `${ICONS.run} 锻炼身体` },
    read:     { pct: readPct, opt: { size: 96, stroke: 8, color: '#8b5cf6', label: `${todayRead.pages||0}`, sub: `阅读页` }, label: `${ICONS.book} 每日阅读` },
  };
  const RING_LINKS = { task: 'plan', water: 'food', exercise: 'exercise', read: 'read' };
  const ringsHtml = layout.rings.filter(k => !layout.hiddenRings.includes(k)).map(k => {
    const r = RING_DEFS[k]; if (!r) return '';
    const link = RING_LINKS[k];
    return `<div class="dash-ring-card" onclick="Nav.switchTo('${link}')" title="查看详情">${progressRing(r.pct, r.opt)}<div class="dash-ring-label">${r.label}</div></div>`;
  }).join('');

  return `
    <div class="dash-hero glass">
      <span class="hero-float f1"></span>
      <span class="hero-float f2"></span>
      <div class="dash-hero-greet" id="dashHeroGreet">你好，${UserProfile.displayName}</div>
      <div class="dash-hero-tagline">用游戏化的方式，把自律养成习惯</div>
      <div class="dash-hero-main">
        <div class="dash-hero-left">
          <div class="dash-clock-time" id="dashClockTime">00:00:00</div>
          <div class="dash-clock-date" id="dashClockDate">载入中...</div>
        </div>
        <button class="dash-checkin-btn ${checkedIn ? 'done' : ''}" id="checkInBtn" ${checkedIn ? 'disabled' : ''}>${checkedIn ? ICONS.check + ' 今日已打卡' : ICONS.pin + ' 立即打卡'}<span class="dash-checkin-sub">${checkedIn ? `连续第 ${d.streak} 天 ${ICONS.flame}` : '开启元气满满的一天'}</span></button>
      </div>
    </div>
    <div class="dash-rings">${ringsHtml}</div>
    <div class="card" id="secQuickHabits">
      <div class="card-title">${ICONS.bolt} 今日快捷打卡 <span class="card-subtitle">一键记录，省去进子页面</span></div>
      <div class="quick-habits">
        <button class="quick-habit" onclick="quickWater()">
          <span class="qh-ico" style="color:var(--primary)">${ICONS.water}</span>
          <span class="qh-label">喝水</span>
          <span class="qh-val">${todayWater.water || 0}<small>/8</small></span>
          <span class="qh-add">+1 杯</span>
        </button>
        <button class="quick-habit" onclick="quickReading()">
          <span class="qh-ico" style="color:var(--success)">${ICONS.book}</span>
          <span class="qh-label">阅读</span>
          <span class="qh-val">${todayRead.pages || 0}<small>页</small></span>
          <span class="qh-add">+5 页</span>
        </button>
        <button class="quick-habit" onclick="quickExercise()">
          <span class="qh-ico" style="color:var(--warning)">${ICONS.run}</span>
          <span class="qh-label">运动</span>
          <span class="qh-val">${exMin}<small>分</small></span>
          <span class="qh-add">+10 分</span>
        </button>
      </div>
    </div>
    <div class="dash-overview" id="secOverview">
      <div class="card"><div class="card-title">${ICONS.list} 今日计划进度 <span class="card-subtitle">${doneTasks}/${todayTasks.length} 已完成</span></div>${todayTasks.length ? (doneTasks === todayTasks.length ? `<div class="task-progress-bar"><div class="task-progress-fill" style="width:100%"></div></div><div class="all-done-state"><div class="all-done-icon">${ICONS.star}</div><div class="all-done-text">今日任务全部完成！</div><div class="all-done-sub">太棒了，给自己一点奖励吧</div></div>` : `<div class="task-progress-bar"><div class="task-progress-fill" style="width:${taskPct}%"></div></div><div style="margin-top:12px;">${todayTasks.slice(0,5).map(t => `<div class="task-item-v2 ${t.done?'done':''}" style="margin-bottom:6px;padding:9px 12px;" title="点击完成/取消"><div class="task-checkbox ${t.done?'checked':''}" onclick="toggleTaskFromHome('${t.id}')"></div><span class="task-text">${esc(t.text)}</span></div>`).join('')}${todayTasks.length > 5 ? `<div class="text-muted text-sm" style="padding:8px 4px;">还有 ${todayTasks.length-5} 项待办...</div>` : ''}</div>`) : '<div class="empty-state"><div class="empty-state-icon">'+ICONS.notebook+'</div><div class="empty-state-text">还没有添加今日计划</div><a class="empty-state-action" onclick="Nav.switchTo(\'plan\')">去制定计划 →</a></div>'}<button class="btn btn-outline btn-sm" style="margin-top:12px;" onclick="Nav.switchTo('plan')">前往计划 →</button></div>
      <div class="card"><div class="card-title">${ICONS.chart} 今日数据概览</div><div class="grid-2 dash-stats-grid" style="gap:12px;">${[{icon:ICONS.water,label:'杯水',val:todayWater.water||0,color:'var(--primary)',link:'food'},{icon:ICONS.run,label:'运动分钟',val:exMin,color:'var(--warning)',link:'exercise'},{icon:ICONS.book,label:'阅读页数',val:todayRead.pages||0,color:'var(--success)',link:'read'},{icon:ICONS.clock,label:'阅读分钟',val:todayRead.minutes||0,color:'var(--purple)',link:'read'}].map(s=>`<div class="dash-mini-stat" onclick="Nav.switchTo('${s.link}')" title="查看${s.label}"><div class="dash-mini-stat-num" style="color:${s.color}">${s.val}</div><div class="dash-mini-stat-label">${s.icon} ${s.label}</div></div>`).join('')}</div></div>
    </div>
    <div class="card" id="secStreak"><div class="card-title">${ICONS.calendar} 最近 7 天打卡</div><div class="streak-calendar">${calHtml}</div></div>
    <div class="dash-quote glass" id="secQuote"><div class="dash-quote-deco">"</div><div class="dash-quote-cn">${ICONS.bulb} ${esc(q.cn)}</div><div class="dash-quote-en">${esc(q.en)}</div></div>
  `;
};
ModuleHooks.home = () => {
  $('#checkInBtn')?.addEventListener('click', (e) => {
    const r = Game.checkIn();
    if (!r.ok) { toast(r.msg, 'warning'); return; }
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    confetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    toast('打卡成功！' + ICONS.flame + ' 连续第 ' + Game.data.streak + ' 天', 'success');
    Nav.switchTo('home');
  });
  Clock.tick();
  // 应用首页板块显隐（纯个人偏好，无解锁）
  const lay = HomeLayout.get();
  const toggleSec = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };
  toggleSec('secOverview', lay.sections.overview);
  toggleSec('secStreak', lay.sections.streak);
  toggleSec('secQuote', lay.sections.quote);
  renderFirstRunHint();
};

// ---------- 计划管理 (每日 / 长期 / 周期) ----------
const TASK_CATEGORIES = {
  exercise: { name: '运动', dotClass: 'exercise', attr: 'strength' },
  study: { name: '学习', dotClass: 'study', attr: 'intelligence' },
  life: { name: '生活', dotClass: 'life', attr: 'charisma' },
  work: { name: '工作', dotClass: 'work', attr: 'creativity' },
};
const LONG_CATEGORIES = [
  { key: 'career', name: '事业', color: '#2563eb' },
  { key: 'health', name: '健康', color: '#10b981' },
  { key: 'wealth', name: '财富', color: '#f59e0b' },
  { key: 'study', name: '学习', color: '#8b5cf6' },
  { key: 'life', name: '生活', color: '#ec4899' },
  { key: 'travel', name: '旅行', color: '#14b8a6' },
];
const RECUR_LABELS = { daily: '每天', workday: '工作日', weekly: '每周', monthly: '每月' };
const WEEK_DAYS = ['日','一','二','三','四','五','六'];

let planSub = 'daily';     // daily | long | cycle
let planTab = 'today';     // daily 子标签: today | todo | done
let planDate = todayKey(); // 当前查看的每日计划日期

const getPlan = (date) => Store.get(`wb_plan_${date}`, []);
const setPlan = (date, v) => Store.set(`wb_plan_${date}`, v);

// --- 周期任务自动生成 ---
function recurringApplies(dateStr, r) {
  const dt = new Date(dateStr + 'T00:00:00');
  const dow = dt.getDay();
  if (r.freq === 'daily') return true;
  if (r.freq === 'workday') return dow >= 1 && dow <= 5;
  if (r.freq === 'weekly') return (r.days || []).includes(dow);
  if (r.freq === 'monthly') return (r.dayOfMonth || 1) === dt.getDate();
  return false;
}
function generateRecurringTasks(date) {
  const rules = Store.get('wb_recurring', []);
  if (!rules.length) return;
  const tasks = getPlan(date);
  let changed = false;
  rules.forEach(r => {
    if (r.lastGen === date) return;
    if (!recurringApplies(date, r)) return;
    if (tasks.find(t => t.recurringRule === r.id)) return;
    tasks.push({ id: uid(), text: r.title, cat: r.cat, priority: r.priority || 'mid', done: false, recurringRule: r.id });
    r.lastGen = date; changed = true;
  });
  if (changed) { setPlan(date, tasks); Store.set('wb_recurring', rules); }
}
function nextOccurrence(r) {
  for (let i = 0; i < 370; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    if (recurringApplies(ds, r)) return ds;
  }
  return null;
}
function getDailyAtHistory(type, days) {
  const dates = lastNDays(days);
  return dates.map(date => ({ date, data: Store.get(`wb_${type}_${date}`, null) }));
}

Modules.plan = () => {
  if (planDate === todayKey()) generateRecurringTasks(todayKey());
  const tabs = [
    { k: 'daily', n: `${ICONS.calendar} 每日计划` },
    { k: 'long', n: `${ICONS.target} 长期计划` },
    { k: 'cycle', n: `${ICO.refresh} 周期计划` },
  ];
  let body = '';
  if (planSub === 'long') body = planLongHtml();
  else if (planSub === 'cycle') body = planCycleHtml();
  else body = planDailyHtml();
  return `
    <div class="plan-subnav">${tabs.map(t => `<div class="plan-sub ${planSub === t.k ? 'active' : ''}" onclick="switchPlanSub('${t.k}')">${t.n}</div>`).join('')}</div>
    ${body}`;
};
ModuleHooks.plan = () => { $('#taskInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); }); initTaskDrag(); };
let dragTaskId = null;
function initTaskDrag() {
  const list = $('#taskList'); if (!list) return;
  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.task-item-v2'); if (!item) return;
    dragTaskId = item.dataset.id; item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragTaskId); } catch {}
  });
  list.addEventListener('dragend', () => {
    list.querySelectorAll('.dragging, .drag-over').forEach(el => el.classList.remove('dragging', 'drag-over'));
    dragTaskId = null;
  });
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const over = e.target.closest('.task-item-v2');
    list.querySelectorAll('.drag-over').forEach(el => { if (el !== over) el.classList.remove('drag-over'); });
    if (over && over.dataset.id !== dragTaskId) over.classList.add('drag-over');
  });
  list.addEventListener('drop', (e) => {
    e.preventDefault();
    const over = e.target.closest('.task-item-v2'); if (!over || !dragTaskId) return;
    const targetId = over.dataset.id; if (targetId === dragTaskId) return;
    const tasks = getPlan(planDate);
    const from = tasks.findIndex(t => t.id === dragTaskId);
    const to = tasks.findIndex(t => t.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = tasks.splice(from, 1);
    tasks.splice(to, 0, moved);
    setPlan(planDate, tasks);
    Nav.refresh();
  });
}
function switchPlanSub(s) { planSub = s; Nav.refresh(); }

// ====== 每日计划 ======
function planDailyHtml() {
  const tasks = getPlan(planDate);
  let display = tasks;
  if (planTab === 'done') display = tasks.filter(t => t.done);
  else if (planTab === 'todo') display = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total ? (done / total * 100).toFixed(0) : 0;
  const dt = new Date(planDate + 'T00:00:00');
  const isToday = planDate === todayKey();
  const dateLabel = `${dt.getMonth() + 1}月${dt.getDate()}日 周${WEEK_DAYS[dt.getDay()]}${isToday ? ' · 今天' : ''}`;
  const chartData = getDailyAtHistory('plan', 7).map((h, i) => {
    const t = h.data || [];
    const rate = t.length ? Math.round(t.filter(x => x.done).length / t.length * 100) : 0;
    return { label: dayLabels(7)[i], value: rate, today: i === 6, color: rate >= 80 ? '#10b981' : rate >= 50 ? '#3b82f6' : '#94a3b8' };
  });
  return `
    <div class="card">
      <div class="flex-between" style="margin-bottom:10px;">
        <div class="card-title" style="margin-bottom:0;">${ICONS.calendar} ${dateLabel}</div>
        <div class="date-nav">
          <button class="btn-icon" onclick="shiftPlanDate(-1)" title="前一天">‹</button>
          ${isToday ? '' : '<button class="btn-icon date-today-btn" onclick="planDate=todayKey();Nav.refresh()" title="回到今天">今</button>'}
          <button class="btn-icon" onclick="shiftPlanDate(1)" title="后一天">›</button>
        </div>
      </div>
      <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
      <div class="plan-tabs" style="margin-top:12px;">
        <div class="plan-tab ${planTab==='today'?'active':''}" onclick="switchPlanTab('today')">全部 ${total}</div>
        <div class="plan-tab ${planTab==='todo'?'active':''}" onclick="switchPlanTab('todo')">待办 ${total-done}</div>
        <div class="plan-tab ${planTab==='done'?'active':''}" onclick="switchPlanTab('done')">已完成 ${done}</div>
      </div>
    </div>
    <div class="card">
      <div class="quick-add-bar">
        <input type="text" id="taskInput" placeholder="添加任务，按 Enter 快速创建..." maxlength="80">
        <select id="taskCat">${Object.entries(TASK_CATEGORIES).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select>
        <button class="quick-add-btn" onclick="addTask()" title="添加任务">${ICO.plus}</button>
      </div>
      <div id="taskList">
        ${display.length ? display.map(t => {
          const cat = TASK_CATEGORIES[t.cat] || TASK_CATEGORIES.life;
          const priClass = t.priority === 'high' ? 'pri-high' : t.priority === 'low' ? 'pri-low' : 'pri-mid';
          const recurTag = t.recurringRule ? '<span class="task-recur-tag" title="周期任务">'+ICO.refresh+'</span>' : '';
          return `<div class="task-item-v2 ${t.done?'done':''} ${priClass}" data-id="${t.id}" draggable="true" title="拖拽可调整顺序">
            <div class="task-checkbox ${t.done?'checked':''}" onclick="toggleTask('${t.id}')"></div>
            <div class="task-cat-dot ${cat.dotClass}" title="${cat.name}"></div>
            <span class="task-text" onclick="editTaskInline('${t.id}')">${esc(t.text)}</span>
            ${recurTag}
            <div class="task-actions">
              <button class="btn-icon" onclick="editTaskModal('${t.id}')" title="编辑">${ICO.edit}</button>
              <button class="btn-icon danger" onclick="confirmDelTask('${t.id}')" title="删除">${ICO.trash}</button>
            </div>
          </div>`;
        }).join('') : `<div class="empty-state-v2"><div class="empty-state-v2-icon">${ICONS.notebook}</div><div class="empty-state-v2-text">${planTab==='done'?'还没有完成的任务':'没有待办任务'}</div><div class="empty-state-v2-hint">${planTab==='today'?'在上方输入框中添加任务吧':''}</div></div>`}
      </div>
    </div>
    <div class="card"><div class="card-title">📈 近 7 天完成率</div>${barChart(chartData, { height: 80, max: 100 })}</div>
  `;
}
function shiftPlanDate(delta) {
  const dt = new Date(planDate + 'T00:00:00');
  dt.setDate(dt.getDate() + delta);
  planDate = dt.toISOString().split('T')[0];
  Nav.refresh();
}
function switchPlanTab(tab) { planTab = tab; Nav.refresh(); }
function addTask() {
  const input = $('#taskInput'), cat = $('#taskCat').value, text = input.value.trim();
  if (!text) return toast('请输入任务内容', 'warning');
  const tasks = getPlan(planDate);
  tasks.push({ id: uid(), text, cat, priority: 'mid', done: false });
  setPlan(planDate, tasks);
  toast('任务已添加', 'success');
  Nav.refresh();
  setTimeout(() => $('#taskInput')?.focus(), 50);
}
function toggleTask(id) {
  const tasks = getPlan(planDate);
  const t = tasks.find(x => x.id === id); if (!t) return;
  _doToggleTask(tasks, t, planDate);
}
function toggleTaskFromHome(id) {
  const date = todayKey();
  const tasks = getPlan(date);
  const t = tasks.find(x => x.id === id); if (!t) return;
  _doToggleTask(tasks, t, date, true);
}
function completeTaskById(id) {
  const date = todayKey();
  const tasks = getPlan(date);
  const t = tasks.find(x => x.id === id); if (!t || t.done) return;
  _doToggleTask(tasks, t, date);
  toast(`🍅 专注完成：${esc(t.text.slice(0, 16))}`, 'success');
}
function _doToggleTask(tasks, t, date, fromHome) {
  const wasDone = t.done; t.done = !t.done;
  setPlan(date, tasks);
  if (t.done && !wasDone) {
    Game.addTaskDone();
    const cat = TASK_CATEGORIES[t.cat] || TASK_CATEGORIES.life;
    Game.reward(10, 5, 2, cat.attr);
    toast(`完成！${cat.attr ? ATTRIBUTES.find(a=>a.key===cat.attr).icon + ' ' : ''}干得好`, 'success');
  } else if (!t.done && wasDone) {
    toast('任务已恢复', 'info');
  }
  if (fromHome && Nav.current === 'home') Nav.refresh(); else Nav.refresh();
}
function confirmDelTask(id) {
  const tasks = getPlan(planDate); const t = tasks.find(x => x.id === id); if (!t) return;
  UI.confirm(`确定删除任务「${t.text.slice(0,30)}」吗？`, () => { setPlan(planDate, tasks.filter(x => x.id !== id)); Nav.refresh(); });
}
function editTaskInline(id) {
  const tasks = getPlan(planDate); const t = tasks.find(x => x.id === id); if (!t || t.done) return;
  const item = $(`.task-item-v2[data-id="${id}"]`); if (!item) return;
  const textEl = item.querySelector('.task-text'); const oldText = t.text;
  textEl.outerHTML = `<input class="task-edit-input" id="inlineEdit_${id}" value="${esc(oldText)}">`;
  const inp = $(`#inlineEdit_${id}`); inp.focus(); inp.select();
  const save = () => { const newText = inp.value.trim(); if (newText && newText !== oldText) { t.text = newText; setPlan(planDate, tasks); } Nav.refresh(); };
  inp.addEventListener('blur', save);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') Nav.refresh(); });
}
function editTaskModal(id) {
  const tasks = getPlan(planDate); const t = tasks.find(x => x.id === id); if (!t) return;
  UI.editModal({ title: '编辑任务', icon: ICONS.list, fields: [
    { key: 'text', label: '任务内容', type: 'text', placeholder: '任务内容' },
    { key: 'cat', label: '分类', type: 'select', options: Object.entries(TASK_CATEGORIES).map(([k,v])=>({value:k,label:v.name})) },
    { key: 'priority', label: '优先级', type: 'select', options: [{value:'high',label:'🔴 高'},{value:'mid',label:'🟡 中'},{value:'low',label:'🟢 低'}] },
  ], values: t, onSave: (v) => { Object.assign(t, v); setPlan(planDate, tasks); toast('任务已更新', 'success'); Nav.refresh(); },
  onDelete: () => { UI.confirm(`确定删除任务「${t.text.slice(0,30)}」吗？`, () => { setPlan(planDate, tasks.filter(x => x.id !== id)); Nav.refresh(); }); } });
}

// ====== 长期计划 ======
function planLongHtml() {
  const goals = Store.get('wb_longterm', []);
  const active = goals.filter(g => !g.done).sort((a,b)=> (a.targetDate||'9999').localeCompare(b.targetDate||'9999'));
  const done = goals.filter(g => g.done);
  const renderGoal = (g) => {
    const cat = LONG_CATEGORIES.find(c => c.key === g.cat) || LONG_CATEGORIES[0];
    const cur = g.current || 0, tgt = g.target || 0;
    const pct = tgt ? Math.min(100, Math.round(cur / tgt * 100)) : (g.done ? 100 : 0);
    let countdown = '';
    if (!g.done && g.targetDate) {
      const left = daysBetween(todayKey(), g.targetDate);
      countdown = left >= 0 ? `还剩 ${left} 天` : `已逾期 ${Math.abs(left)} 天`;
    }
    return `<div class="goal-card" data-id="${g.id}">
      <div class="goal-top"><div class="goal-title">${esc(g.title)}</div><span class="goal-cat" style="background:${cat.color}1a;color:${cat.color}">${cat.name}</span></div>
      ${g.target ? `<div class="goal-progress-row"><div class="goal-bar"><div class="goal-bar-fill" style="width:${pct}%;background:${cat.color}"></div></div><div class="goal-pct">${pct}%</div></div>
      <div class="goal-meta">${cur} / ${tgt} ${g.unit || ''} · ${countdown}</div>` : `<div class="goal-meta">${countdown || '未设数值目标'}</div>`}
      <div class="goal-actions">
        ${g.done ? '<span class="goal-done-tag">'+ICONS.check+' 已完成</span>' : `<button class="btn btn-outline btn-sm" onclick="updateGoal('${g.id}', 1)">+1</button><button class="btn btn-outline btn-sm" onclick="updateGoal('${g.id}', -1)">-1</button><button class="btn btn-primary btn-sm" onclick="markGoalDone('${g.id}')">完成</button>`}
        <button class="btn-icon" onclick="editGoal('${g.id}')" title="编辑">${ICO.edit}</button>
        <button class="btn-icon danger" onclick="confirmDelGoal('${g.id}')" title="删除">${ICO.trash}</button>
      </div>
    </div>`;
  };
  return `
    <div class="card">
      <div class="flex-between"><div class="card-title" style="margin:0;">${ICONS.target} 长期目标 (${goals.length})</div><button class="btn btn-primary btn-sm" onclick="addGoal()">+ 新建目标</button></div>
      <div class="text-muted text-sm" style="margin-top:6px;">为目标设定进度与截止日期，app 会帮你追踪倒计时</div>
    </div>
    ${active.length ? active.map(renderGoal).join('') : ''}
    ${done.length ? `<div class="card"><div class="card-title">${ICONS.check} 已完成目标</div>${done.map(renderGoal).join('')}</div>` : ''}
    ${!goals.length ? '<div class="empty-state-v2"><div class="empty-state-v2-icon">'+ICONS.target+'</div><div class="empty-state-v2-text">还没有长期目标</div><div class="empty-state-v2-hint">设定一个想在未来达成的目标吧</div></div>' : ''}
  `;
}
function addGoal() {
  UI.editModal({ title: '新建长期目标', icon: ICONS.target, fields: [
    { key: 'title', label: '目标名称', type: 'text', placeholder: '例如：三个月减重 5 公斤' },
    { key: 'cat', label: '分类', type: 'select', options: LONG_CATEGORIES.map(c => ({ value: c.key, label: c.name })) },
    { key: 'target', label: '目标数值（选填）', type: 'number', placeholder: '例如 5' },
    { key: 'unit', label: '单位（选填）', type: 'text', placeholder: '公斤 / 本 / 元' },
    { key: 'targetDate', label: '截止日期（选填）', type: 'text', placeholder: '2026-12-31' },
  ], values: { cat: 'career' }, onSave: (v) => {
    const goals = Store.get('wb_longterm', []);
    goals.push({ id: uid(), title: v.title.trim(), cat: v.cat, current: 0, target: Number(v.target) || 0, unit: v.unit.trim(), targetDate: v.targetDate.trim(), done: false, createdAt: todayKey() });
    Store.set('wb_longterm', goals);
    toast('目标已创建', 'success'); Nav.refresh();
  } });
}
function editGoal(id) {
  const goals = Store.get('wb_longterm', []); const g = goals.find(x => x.id === id); if (!g) return;
  UI.editModal({ title: '编辑目标', icon: ICONS.target, fields: [
    { key: 'title', label: '目标名称', type: 'text' },
    { key: 'cat', label: '分类', type: 'select', options: LONG_CATEGORIES.map(c => ({ value: c.key, label: c.name })) },
    { key: 'target', label: '目标数值', type: 'number' },
    { key: 'unit', label: '单位', type: 'text' },
    { key: 'targetDate', label: '截止日期', type: 'text', placeholder: '2026-12-31' },
  ], values: g, onSave: (v) => { Object.assign(g, { title: v.title.trim(), cat: v.cat, target: Number(v.target) || 0, unit: v.unit.trim(), targetDate: v.targetDate.trim() }); Store.set('wb_longterm', goals); toast('目标已更新', 'success'); Nav.refresh(); },
  onDelete: () => confirmDelGoal(id) });
}
function updateGoal(id, delta) {
  const goals = Store.get('wb_longterm', []); const g = goals.find(x => x.id === id); if (!g) return;
  g.current = Math.max(0, (g.current || 0) + delta);
  Store.set('wb_longterm', goals); Nav.refresh();
  Game.reward(3, 1, 0, 'discipline');
}
function markGoalDone(id) {
  const goals = Store.get('wb_longterm', []); const g = goals.find(x => x.id === id); if (!g) return;
  g.done = true; if (g.target) g.current = g.target;
  Store.set('wb_longterm', goals);
  Game.reward(30, 20, 5, 'discipline');
  toast('目标达成！太棒了 🎉', 'success'); Nav.refresh();
}
function confirmDelGoal(id) {
  const goals = Store.get('wb_longterm', []); const g = goals.find(x => x.id === id); if (!g) return;
  UI.confirm(`确定删除目标「${g.title.slice(0,30)}」吗？`, () => { Store.set('wb_longterm', goals.filter(x => x.id !== id)); Nav.refresh(); });
}

// ====== 周期计划 ======
function planCycleHtml() {
  const rules = Store.get('wb_recurring', []);
  const todayMatches = rules.filter(r => recurringApplies(todayKey(), r));
  return `
    <div class="card">
      <div class="flex-between"><div class="card-title" style="margin:0;">${ICO.refresh} 周期计划 (${rules.length})</div><button class="btn btn-primary btn-sm" onclick="addRecurring()">+ 新建周期</button></div>
      <div class="text-muted text-sm" style="margin-top:6px;">设定重复规则后，app 会在对应日期自动把任务加入「每日计划」</div>
    </div>
    ${todayMatches.length ? `<div class="card"><div class="card-title">📥 今日已生成 (${todayMatches.length})</div>${todayMatches.map(r => `<div class="recur-gen-item"><span>🔄 ${esc(r.title)}</span><button class="btn btn-outline btn-sm" onclick="switchPlanSub('daily')">去完成 →</button></div>`).join('')}</div>` : ''}
    ${rules.length ? rules.map(r => {
      const cat = TASK_CATEGORIES[r.cat] || TASK_CATEGORIES.life;
      const next = nextOccurrence(r);
      let freqText = RECUR_LABELS[r.freq] || r.freq;
      if (r.freq === 'weekly') freqText += `（周${r.days.map(d => WEEK_DAYS[d]).join('、')}）`;
      if (r.freq === 'monthly') freqText += `（每月 ${r.dayOfMonth || 1} 号）`;
      return `<div class="recur-card" data-id="${r.id}">
        <div class="recur-top"><div class="recur-title">${esc(r.title)}</div><div class="task-cat-dot ${cat.dotClass}"></div></div>
        <div class="recur-meta">🔁 ${freqText} · 下次：${next ? next.slice(5).replace('-','/') : '—'}</div>
        <div class="recur-actions">
          <button class="btn-icon" onclick="editRecurring('${r.id}')" title="编辑">${ICO.edit}</button>
          <button class="btn-icon danger" onclick="confirmDelRecurring('${r.id}')" title="删除">${ICO.trash}</button>
        </div>
      </div>`;
    }).join('') : ''}
    ${!rules.length ? '<div class="empty-state-v2"><div class="empty-state-v2-icon">'+ICO.refresh+'</div><div class="empty-state-v2-text">还没有周期计划</div><div class="empty-state-v2-hint">把每天 / 每周要重复做的事交给它吧</div></div>' : ''}
  `;
}
function addRecurring() {
  let selDays = [], selDom = 1;
  UI.editModal({ title: '新建周期计划', icon: ICO.refresh, fields: [
    { key: 'title', label: '任务标题', type: 'text', placeholder: '例如：背单词 30 个' },
    { key: 'freq', label: '重复频率', type: 'select', options: [{value:'daily',label:'每天'},{value:'workday',label:'工作日（周一至周五）'},{value:'weekly',label:'每周（指定星期）'},{value:'monthly',label:'每月（指定日期）'}] },
    { key: 'cat', label: '分类', type: 'select', options: Object.entries(TASK_CATEGORIES).map(([k,v])=>({value:k,label:v.name})) },
    { key: 'priority', label: '优先级', type: 'select', options: [{value:'high',label:'🔴 高'},{value:'mid',label:'🟡 中'},{value:'low',label:'🟢 低'}] },
  ], values: { freq: 'daily', cat: 'study', priority: 'mid' }, onSave: (v) => {
    const rules = Store.get('wb_recurring', []);
    rules.push({ id: uid(), title: v.title.trim(), freq: v.freq, cat: v.cat, priority: v.priority, days: v.freq === 'weekly' ? selDays : [], dayOfMonth: v.freq === 'monthly' ? selDom : 1, lastGen: '' });
    Store.set('wb_recurring', rules);
    toast('周期计划已创建', 'success');
    planSub = 'cycle'; Nav.refresh();
  } });
  injectRecurExtra((v) => selDays = v, (v) => selDom = v, []);
}
function editRecurring(id) {
  const rules = Store.get('wb_recurring', []); const r = rules.find(x => x.id === id); if (!r) return;
  let selDays = (r.days || []).slice(), selDom = r.dayOfMonth || 1;
  UI.editModal({ title: '编辑周期计划', icon: ICO.refresh, fields: [
    { key: 'title', label: '任务标题', type: 'text' },
    { key: 'freq', label: '重复频率', type: 'select', options: [{value:'daily',label:'每天'},{value:'workday',label:'工作日（周一至周五）'},{value:'weekly',label:'每周（指定星期）'},{value:'monthly',label:'每月（指定日期）'}] },
    { key: 'cat', label: '分类', type: 'select', options: Object.entries(TASK_CATEGORIES).map(([k,v])=>({value:k,label:v.name})) },
    { key: 'priority', label: '优先级', type: 'select', options: [{value:'high',label:'🔴 高'},{value:'mid',label:'🟡 中'},{value:'low',label:'🟢 低'}] },
  ], values: r, onSave: (v) => {
    Object.assign(r, { title: v.title.trim(), freq: v.freq, cat: v.cat, priority: v.priority, days: v.freq === 'weekly' ? selDays : [], dayOfMonth: v.freq === 'monthly' ? selDom : 1 });
    Store.set('wb_recurring', rules);
    toast('周期计划已更新', 'success'); Nav.refresh();
  }, onDelete: () => confirmDelRecurring(id) });
  injectRecurExtra((v) => selDays = v, (v) => selDom = v, r.days || []);
}
function injectRecurExtra(setDays, setDom, initialDays) {
  setTimeout(() => {
    const body = $('.modal-body'); if (!body) return;
    const wrap = document.createElement('div');
    wrap.className = 'recur-extra';
    wrap.innerHTML = `
      <div class="recur-weekly" id="recurWeekly" style="display:none;">
        <label class="field-label">重复星期</label>
        <div class="recur-day-chips" id="recurDayChips">${WEEK_DAYS.map((d,i)=>`<div class="recur-day-chip ${initialDays.includes(i)?'selected':''}" data-dow="${i}" onclick="this.classList.toggle('selected')">${d}</div>`).join('')}</div>
      </div>
      <div class="recur-monthly" id="recurMonthly" style="display:none;">
        <label class="field-label">每月几号</label>
        <input type="number" id="recurDom" min="1" max="28" value="1">
      </div>`;
    body.appendChild(wrap);
    const freqSel = $('#modal_freq');
    const sync = () => {
      const f = freqSel.value;
      $('#recurWeekly').style.display = f === 'weekly' ? 'block' : 'none';
      $('#recurMonthly').style.display = f === 'monthly' ? 'block' : 'none';
    };
    freqSel.addEventListener('change', sync); sync();
  }, 100);
  setTimeout(() => {
    const saveBtn = $('#modalSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const chips = $$('#recurDayChips .recur-day-chip.selected').map(c => parseInt(c.dataset.dow));
      setDays(chips);
      const dom = $('#recurDom'); if (dom) setDom(parseInt(dom.value) || 1);
    }, true);
  }, 120);
}
function confirmDelRecurring(id) {
  const rules = Store.get('wb_recurring', []); const r = rules.find(x => x.id === id); if (!r) return;
  UI.confirm(`确定删除周期计划「${r.title.slice(0,30)}」吗？`, () => { Store.set('wb_recurring', rules.filter(x => x.id !== id)); Nav.refresh(); });
}

// ---------- 个人属性页 (LifeUp 风格) ----------
function attrTotalExp(ad) { let total = 0; for (let lv = 1; lv < ad.lv; lv++) total += lv * 50; total += ad.exp; return total; }
Modules.attributes = () => {
  const d = Game.data;
  const attrs = ATTRIBUTES.map(a => {
    const ad = d.attributes[a.key] || { lv: 1, exp: 0 };
    const need = ad.lv * 50;
    const pct = Math.min(100, ad.exp / need * 100);
    return { key: a.key, name: a.name, icon: a.icon, color: a.color, lv: ad.lv, exp: ad.exp, need, pct: pct.toFixed(0), totalExp: attrTotalExp(ad) };
  });
  const radarData = ATTRIBUTES.map(a => { const ad = d.attributes[a.key] || { lv: 1 }; return { label: a.name, value: Math.min(100, (ad.lv - 1) / 15 * 100), color: a.color }; });
  const totalExp = attrs.reduce((s, a) => s + a.totalExp, 0);
  const achieveCount = (d.achievements || []).length;
  return `
    <div class="attr-hero card">
      <div class="attr-hero-left">
        <div class="attr-level-badge">Lv.${d.level}</div>
        <div class="attr-hero-name">我的属性</div>
        <div class="attr-hero-sub">加入于 ${d.joinDate}</div>
      </div>
      <div class="attr-hero-right">
        <div class="attr-mini"><span>${ICONS.coin}</span> ${d.coins}</div>
        <div class="attr-mini"><span>${ICONS.heart}</span> ${d.health}</div>
        <div class="attr-mini"><span>${ICONS.flame}</span> ${d.streak}</div>
        <div class="attr-mini"><span>${ICONS.tomato}</span> ${d.pomodoros}</div>
      </div>
    </div>
    <div class="card"><div class="card-title">属性雷达</div><div style="display:flex;justify-content:center;">${radarChart(radarData, { size: 280 })}</div></div>
    <div class="card"><div class="card-title">属性详情（${ATTRIBUTES.length} 项）</div>
      <div class="attr-list">${attrs.map(a => `
        <div class="attr-row">
          <div class="attr-icon" style="background:${a.color}1a;color:${a.color}">${a.icon}</div>
          <div class="attr-main">
            <div class="attr-row-top"><span class="attr-name">${a.name}</span><span class="attr-lv" style="color:${a.color}">Lv.${a.lv}</span></div>
            <div class="attr-desc">${ATTRIBUTES.find(x=>x.key===a.key).desc}</div>
            <div class="attr-bar"><div class="attr-bar-fill" style="width:${a.pct}%;background:${a.color}"></div></div>
            <div class="attr-exp-text">${a.exp} / ${a.need} EXP（累计 ${a.totalExp}）</div>
          </div>
        </div>`).join('')}</div>
    </div>
    <div class="card"><div class="card-title">📊 成长总览</div>
      <div class="attr-stats-grid">
        <div><div class="attr-stat-num">${d.level}</div><div class="attr-stat-label">当前等级</div></div>
        <div><div class="attr-stat-num">${totalExp}</div><div class="attr-stat-label">累计属性EXP</div></div>
        <div><div class="attr-stat-num">${d.totalTasksDone}</div><div class="attr-stat-label">完成任务</div></div>
        <div><div class="attr-stat-num">${achieveCount}</div><div class="attr-stat-label">解锁成就</div></div>
        <div><div class="attr-stat-num">${d.totalCheckIns}</div><div class="attr-stat-label">累计打卡</div></div>
        <div><div class="attr-stat-num">${d.pomodoros}</div><div class="attr-stat-label">番茄专注</div></div>
      </div>
      <button class="btn btn-outline btn-sm" style="margin-top:12px;width:100%;" onclick="Nav.switchTo('achieve')">查看成就墙 →</button>
    </div>
  `;
};

// ---------- 每日阅读 (豆瓣推荐 + 手动记录) ----------
const BOOK_COLORS = ['#2563eb','#8b5cf6','#ec4899','#f59e0b','#10b981','#14b8a6','#6366f1','#ef4444'];
Modules.read = () => {
  const today = Store.getDaily('reading', { pages: 0, minutes: 0, notes: '' });
  const books = Store.get('wb_books', []);
  const goal = Store.get('wb_reading_goal', 30);
  const history = Store.get('wb_reading_history', []);
  const todayPages = today.pages || 0;
  const pct = Math.min(100, (todayPages / goal * 100));
  let streak = 0;
  const dates = lastNDays(60);
  for (let i = dates.length - 1; i >= 0; i--) { const h = Store.get(`wb_reading_${dates[i]}`, null); if (h && (h.pages > 0 || h.minutes > 0)) streak++; else if (i < dates.length - 1) break; }
  const hist7 = getDailyHistory('reading', 7);
  const chartData = hist7.map((h, i) => ({ label: dayLabels(7)[i], value: (h.data?.minutes) || 0, today: i === 6, color: '#8b5cf6' }));
  return `
    <div class="reading-streak-banner"><div class="reading-streak-flame">${streak > 0 ? '🔥' : '📚'}</div><div class="reading-streak-info"><div class="reading-streak-num">${streak} 天连续阅读</div><div class="reading-streak-text">${streak > 0 ? '保持下去，阅读是最值得的投资！' : '今天开始你的阅读之旅吧'}</div></div><div style="text-align:center;">${progressRing(pct, { size: 72, stroke: 6, color: '#8b5cf6', label: `${todayPages}`, sub: `/${goal}页` })}</div></div>
    <div class="card weread-banner"><div class="weread-logo">📖</div><div class="weread-info"><div class="weread-title">微信读书数据</div><div class="weread-desc">${Store.get('wb_weread_cookie','') ? '已连接，点击同步读取你的阅读数据' : '连接微信读书，读取你的真实阅读数据'}</div></div><div class="weread-actions"><button class="btn btn-outline btn-sm" onclick="openWereadSettings()">⚙️ 设置</button>${Store.get('wb_weread_cookie','') ? '<button class="btn btn-primary btn-sm" onclick="syncWeread()">同步数据</button>' : ''}</div></div>
    <div id="wereadData"></div>
    <div class="card"><div class="card-title">🔍 微信读书搜书</div><div class="form-row"><div class="form-group" style="flex:1;"><input type="text" id="wereadSearch" placeholder="输入书名，在微信读书中搜索" onkeydown="if(event.key==='Enter')searchWeRead()"></div><div class="form-group"><button class="btn btn-primary" onclick="searchWeRead()">搜索</button></div></div></div>
    <div class="card"><div class="card-title">📚 豆瓣热门图书推荐</div><div id="bookRecommend">${skelNews(8)}</div></div>
    <div class="card"><div class="card-title">${ICONS.book} 今日阅读记录</div>
      <div class="form-row"><div class="form-group"><label class="field-label">阅读页数</label><input type="number" id="readPages" value="${todayPages}" min="0"></div><div class="form-group"><label class="field-label">阅读时长（分钟）</label><input type="number" id="readMinutes" value="${today.minutes||0}" min="0"></div></div>
      <div class="form-group"><label class="field-label">阅读笔记</label><textarea id="readNotes" placeholder="今天读到了什么有趣的内容？">${esc(today.notes||'')}</textarea></div>
      <button class="btn btn-primary" onclick="saveReading()">保存今日阅读</button>
    </div>
    <div class="card"><div class="card-title">📈 近 7 天阅读时长</div>${barChart(chartData, { height: 80 })}</div>
    <div class="card"><div class="card-title">📚 我的书架 (${books.length})</div>
      <div class="form-row"><div class="form-group"><input type="text" id="bookTitle" placeholder="书名"></div><div class="form-group"><input type="number" id="bookTotal" placeholder="总页数" min="1"></div></div>
      <div class="form-row"><div class="form-group"><input type="number" id="bookCurrent" placeholder="已读页数" min="0"></div><div class="form-group"><button class="btn btn-primary" onclick="addBook()" style="width:100%;">加入书架</button></div></div>
      <div style="margin-top:14px;">${books.length ? books.map((b, i) => {
        const p = b.total ? Math.min(100, (b.current/b.total*100)).toFixed(0) : 0;
        const color = BOOK_COLORS[i % BOOK_COLORS.length], isDone = b.total && b.current >= b.total;
        return `<div class="reading-book-card" data-id="${b.id}"><div class="book-cover" style="background:linear-gradient(135deg,${color},${color}dd);">${isDone ? '✅' : '📕'}</div><div class="book-info"><div class="book-title">${esc(b.title)} <div class="record-actions"><button class="btn-icon" onclick="editBook('${b.id}')">${ICO.edit}</button><button class="btn-icon danger" onclick="confirmDelBook('${b.id}')">${ICO.trash}</button></div></div><div class="book-progress-text">已读 ${b.current} / ${b.total} 页 · ${p}% ${isDone ? '· 已读完 🎉' : ''}</div><div class="book-bar"><div class="book-bar-fill" style="width:${p}%;background:${color};"></div></div><div class="book-actions"><a href="https://weread.qq.com/web/search?keyword=${encodeURIComponent(b.title)}" target="_blank" class="btn btn-outline btn-sm">📖 微信读书</a><button class="btn btn-outline btn-sm" onclick="updateBook('${b.id}', 5)">+5页</button><button class="btn btn-outline btn-sm" onclick="updateBook('${b.id}', 10)">+10页</button><button class="btn btn-outline btn-sm" onclick="updateBook('${b.id}', -5)">-5页</button></div></div></div>`;
      }).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">📚</div><div class="empty-state-v2-text">书架空空如也</div><div class="empty-state-v2-hint">添加一本书开始阅读吧</div></div>'}</div>
    </div>
    <div class="card"><div class="card-title">${ICONS.calendar} 阅读历史</div>${history.length ? history.slice(-10).reverse().map(h => `<div class="note-item"><div class="note-item-title">${esc(h.date)} · ${h.pages}页 / ${h.minutes}分钟</div>${h.notes ? `<div class="note-item-body">${esc(h.notes)}</div>` : ''}</div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">📚</div><div class="empty-state-v2-text">还没有阅读历史</div><div class="empty-state-v2-hint">读点什么，记录第一页吧</div></div>'}</div>
  `;
};
ModuleHooks.read = () => { loadBookRecommend(); if (Store.get('wb_weread_cookie','')) syncWeread(); };
async function loadBookRecommend() {
  const container = $('#bookRecommend'); if (!container) return;
  container.innerHTML = skelNews(8);
  try {
    const r = await API.books(); const books = r.items || [];
    if (!books.length) { container.innerHTML = '<div class="loading-state">暂无推荐数据，请稍后刷新</div>'; return; }
    container.innerHTML = (r.fallback ? fallbackBanner() : '') + `<div class="online-grid">${books.map(b => `<div class="online-card" onclick="window.open('${b.url}')"><div class="online-card-cover" style="background:#dbeafe;">📖</div><div class="online-card-title">${esc(b.title)}</div><div class="online-card-rate">${b.rate && b.rate !== '暂无' ? `⭐ ${b.rate}` : '暂无评分'}</div><button class="btn btn-outline btn-sm" style="margin-top:6px;width:100%;" onclick="event.stopPropagation();addBookFromDouban('${esc(b.title)}')">加入书架</button></div>`).join('')}</div>`;
  } catch (e) { container.innerHTML = `<div class="loading-state error">${ICONS.warn} 加载失败，点击 <button class="btn btn-outline btn-sm" onclick="loadBookRecommend()">重试</button></div>`; }
}
function addBookFromDouban(title) {
  const books = Store.get('wb_books', []);
  if (books.find(b => b.title === title)) return toast('已在书架中', 'warning');
  books.push({ id: uid(), title, total: 0, current: 0 });
  Store.set('wb_books', books);
  toast(`《${title}》已加入书架 📚`, 'success');
  Nav.refresh();
}
function searchWeRead() {
  const kw = $('#wereadSearch')?.value.trim();
  if (!kw) return toast('请输入书名', 'warning');
  window.open(`https://weread.qq.com/web/search?keyword=${encodeURIComponent(kw)}`);
}
function openWereadSettings() {
  const current = Store.get('wb_weread_cookie', '');
  UI.editModal({ title: '微信读书 Cookie 设置', icon: ICONS.book, saveLabel: '保存',
    fields: [
      { key: 'cookie', label: 'Cookie', type: 'textarea', placeholder: '在此粘贴你的微信读书 Cookie...', minHeight: 120 },
    ],
    values: { cookie: current },
    onSave: (v) => {
      const cookie = v.cookie.trim();
      if (cookie) { Store.set('wb_weread_cookie', cookie); toast('Cookie 已保存，正在同步数据...', 'success'); setTimeout(() => { Nav.refresh(); syncWeread(); }, 300); }
      else { Store.remove('wb_weread_cookie'); toast('Cookie 已清除', 'warning'); Nav.refresh(); }
    },
  });
  // Add instructions below the modal
  setTimeout(() => {
    const modalBody = $('.modal-body');
    if (modalBody) {
      const help = document.createElement('div');
      help.className = 'weread-help';
      help.innerHTML = `
        <div style="margin-top:12px;padding:12px;background:var(--bg-card);border-radius:8px;font-size:13px;line-height:1.8;color:var(--text-light);">
          <div style="font-weight:700;margin-bottom:6px;">${ICONS.list} 获取 Cookie 步骤：</div>
          1. 用浏览器打开 <a href="https://weread.qq.com" target="_blank" style="color:var(--primary);">weread.qq.com</a> 并登录<br>
          2. 按 <kbd>F12</kbd> 打开开发者工具<br>
          3. 切换到 <b>Network</b> 标签页<br>
          4. 刷新页面，点击任意 <code>weread.qq.com</code> 请求<br>
          5. 在 <b>Request Headers</b> 中找到 <code>Cookie</code> 字段<br>
          6. 复制完整的 Cookie 值，粘贴到上方输入框<br>
          <div style="margin-top:8px;color:var(--warning);">⚠️ Cookie 有时效性，过期后需重新获取。Cookie 仅存储在本地浏览器中。</div>
        </div>`;
      modalBody.appendChild(help);
    }
  }, 100);
}
async function syncWeread() {
  const container = $('#wereadData'); if (!container) return;
  const cookie = Store.get('wb_weread_cookie', '');
  if (!cookie) { container.innerHTML = ''; return; }
  container.innerHTML = `<div class="loading-state">${ICONS.book} 正在同步微信读书数据...</div>`;
  try {
    const data = await API.wereadShelf();
    if (!data || !data.books) { container.innerHTML = '<div class="loading-state">暂无数据</div>'; return; }
    const { books, totalReadingTime, finishedCount, readingCount, totalCount } = data;
    const fmtTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`; };
    const sortedBooks = books.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
    const reading = sortedBooks.filter(b => !b.finishReading && b.progress > 0);
    const finished = sortedBooks.filter(b => b.finishReading);
    const unread = sortedBooks.filter(b => !b.finishReading && (!b.progress || b.progress === 0));
    container.innerHTML = `
      <div class="compact-stats">
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--purple);">${fmtTime(totalReadingTime)}</div><div class="compact-stat-label">${ICONS.clock} 总阅读时长</div></div>
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--success);">${finishedCount}</div><div class="compact-stat-label">${ICONS.check} 已读完</div></div>
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--primary);">${readingCount}</div><div class="compact-stat-label">${ICONS.book} 在读</div></div>
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--text-light);">${totalCount}</div><div class="compact-stat-label">${ICONS.book} 书架总数</div></div>
      </div>
      ${reading.length ? `<div class="card"><div class="card-title">${ICONS.book} 在读 (${reading.length})</div><div class="weread-book-list">${reading.slice(0, 10).map(b => `
        <div class="weread-book-item">
          ${b.cover ? `<img class="weread-book-cover" src="${b.cover}" onerror="this.style.display='none'">` : '<div class="weread-book-cover-placeholder">'+ICONS.book+'</div>'}
          <div class="weread-book-info">
            <div class="weread-book-title">${esc(b.title)}</div>
            <div class="weread-book-author">${esc(b.author)}</div>
            <div class="weread-book-progress"><div class="weread-book-progress-bar" style="width:${b.progress}%"></div></div>
            <div class="weread-book-meta">进度 ${b.progress}% · 阅读 ${fmtTime(b.readingTime)}</div>
          </div>
          <a href="https://weread.qq.com/web/book/read?bookId=${b.bookId}" target="_blank" class="btn btn-outline btn-sm">继续读</a>
        </div>`).join('')}</div></div>` : ''}
      ${finished.length ? `<div class="card"><div class="card-title">✅ 已读完 (${finished.length})</div><div class="weread-book-list">${finished.slice(0, 6).map(b => `
        <div class="weread-book-item">
          ${b.cover ? `<img class="weread-book-cover" src="${b.cover}" onerror="this.style.display='none'">` : '<div class="weread-book-cover-placeholder">'+ICONS.check+'</div>'}
          <div class="weread-book-info">
            <div class="weread-book-title">${esc(b.title)}</div>
            <div class="weread-book-author">${esc(b.author)}</div>
            <div class="weread-book-meta">${ICONS.check} 已读完 · 阅读时长 ${fmtTime(b.readingTime)}</div>
          </div>
        </div>`).join('')}</div></div>` : ''}
    `;
    // Auto-add finished books to local bookshelf
    finished.forEach(b => {
      const books = Store.get('wb_books', []);
      if (!books.find(x => x.title === b.title)) {
        books.push({ id: uid(), title: b.title, total: 100, current: 100, wereadId: b.bookId });
        Store.set('wb_books', books);
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="loading-state error">⚠️ ${esc(e.message)}<br><button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="openWereadSettings()">重新设置 Cookie</button></div>`;
  }
}
function saveReading() {
  const pages = parseInt($('#readPages').value) || 0, minutes = parseInt($('#readMinutes').value) || 0, notes = $('#readNotes').value.trim();
  Store.setDaily('reading', { pages, minutes, notes });
  const history = Store.get('wb_reading_history', []); const today = todayKey();
  const idx = history.findIndex(h => h.date === today);
  if (idx >= 0) history[idx] = { date: today, pages, minutes, notes }; else history.push({ date: today, pages, minutes, notes });
  Store.set('wb_reading_history', history);
  Game.reward(Math.floor(minutes/5) + Math.floor(pages/10), Math.floor(pages/5), 2, 'intelligence');
  toast('阅读记录已保存', 'success'); Nav.refresh();
}
function addBook() {
  const title = $('#bookTitle').value.trim(), total = parseInt($('#bookTotal').value) || 0, current = parseInt($('#bookCurrent').value) || 0;
  if (!title) return toast('请输入书名', 'warning');
  const books = Store.get('wb_books', []); books.push({ id: uid(), title, total, current }); Store.set('wb_books', books);
  toast('已加入书架 📚', 'success'); Nav.refresh();
}
function updateBook(id, delta) {
  const books = Store.get('wb_books', []); const b = books.find(x => x.id === id); if (!b) return;
  const old = b.current; b.current = Math.max(0, Math.min(b.total, b.current + delta)); Store.set('wb_books', books);
  if (old < b.total && b.current >= b.total) { Game.reward(30, 20, 10); toast(`读完《${b.title}》🎉`, 'success'); } else Nav.refresh();
}
function editBook(id) {
  const books = Store.get('wb_books', []); const b = books.find(x => x.id === id); if (!b) return;
  UI.editModal({ title: '编辑书籍', icon: '📚', fields: [{ key: 'title', label: '书名', type: 'text' }, { key: 'total', label: '总页数', type: 'number', min: 1 }, { key: 'current', label: '已读页数', type: 'number', min: 0 }], values: b,
    onSave: (v) => { Object.assign(b, v); b.current = Math.min(b.current, b.total); Store.set('wb_books', books); toast('书籍信息已更新', 'success'); Nav.refresh(); },
    onDelete: () => { UI.confirm(`确定从书架中移除《${b.title}》吗？`, () => { Store.set('wb_books', books.filter(x => x.id !== id)); Nav.refresh(); }); } });
}
function confirmDelBook(id) { const books = Store.get('wb_books', []); const b = books.find(x => x.id === id); if (!b) return; UI.confirm(`确定从书架中移除《${b.title}》吗？`, () => { Store.set('wb_books', books.filter(x => x.id !== id)); Nav.refresh(); }); }

// ---------- 锻炼身体 (Keep风格) ----------
let exerciseTab = 'meditation';
let medTimer = null, medSeconds = 0, medRunning = false, breathPhase = 0, breathInterval = null;
const EXERCISE_LIB = [
  { name:'跑步', icon:ICONS.run, cat:'有氧', cal:8, dur:30 }, { name:'快走', icon:ICONS.walk, cat:'有氧', cal:4, dur:30 },
  { name:'跳绳', icon:'🤾', cat:'有氧', cal:12, dur:15 }, { name:'骑行', icon:'🚴', cat:'有氧', cal:7, dur:30 },
  { name:'游泳', icon:'🏊', cat:'有氧', cal:10, dur:30 }, { name:'俯卧撑', icon:'💪', cat:'力量', cal:6, dur:15 },
  { name:'深蹲', icon:'🦵', cat:'力量', cal:5, dur:15 }, { name:'引体向上', icon:'🤸', cat:'力量', cal:8, dur:10 },
  { name:'仰卧起坐', icon:'🔥', cat:'力量', cal:5, dur:15 }, { name:'平板支撑', icon:'🧎', cat:'力量', cal:4, dur:5 },
  { name:'哑铃训练', icon:'🏋️', cat:'力量', cal:6, dur:20 }, { name:'瑜伽', icon:'🧘', cat:'柔韧', cal:3, dur:30 },
  { name:'拉伸', icon:'🤸‍♀️', cat:'柔韧', cal:2, dur:15 }, { name:'其他', icon:'⭐', cat:'其他', cal:4, dur:20 },
];
Modules.exercise = () => {
  const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] });
  const totalMin = today.medMinutes + today.workouts.reduce((s,w)=>s+(w.minutes||0), 0);
  const totalCal = today.workouts.reduce((s,w) => { const ex = EXERCISE_LIB.find(e=>e.name===w.type); return s + (ex ? ex.cal * (w.minutes/30) : 0); }, 0);
  const exCount = today.workouts.length + (today.medMinutes > 0 ? 1 : 0);
  let streak = 0;
  const dates = lastNDays(60);
  for (let i = dates.length - 1; i >= 0; i--) { const ex = Store.get(`wb_exercise_${dates[i]}`, null); const min = ex ? (ex.medMinutes + ex.workouts.reduce((s,w)=>s+(w.minutes||0),0)) : 0; if (min > 0) streak++; else if (i < dates.length - 1) break; }
  const heatDates = lastNDays(28);
  const heatData = heatDates.map(date => { const ex = Store.get(`wb_exercise_${date}`, null); const min = ex ? (ex.medMinutes + ex.workouts.reduce((s,w)=>s+(w.minutes||0),0)) : 0; let v = 0; if (min >= 60) v = 5; else if (min >= 40) v = 4; else if (min >= 20) v = 3; else if (min >= 10) v = 2; else if (min > 0) v = 1; return { date, value: v }; });
  return `
    <div class="compact-stats">
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--warning);">${totalMin}</div><div class="compact-stat-label">${ICONS.clock} 今日运动分钟</div></div>
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--danger);">${ICONS.flame}${streak}</div><div class="compact-stat-label">连续运动天数</div></div>
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--primary);">${Math.round(totalCal)}</div><div class="compact-stat-label"> kcal 消耗</div></div>
    </div>
    <div class="exercise-tabs"><div class="exercise-tab ${exerciseTab==='meditation'?'active':''}" onclick="switchExTab('meditation')">🧘 每日冥想</div><div class="exercise-tab ${exerciseTab==='workout'?'active':''}" onclick="switchExTab('workout')">💪 身体锻炼</div></div>
    <div id="exerciseContent">${exerciseTab === 'meditation' ? renderMeditation() : renderWorkout(today)}</div>
    <div class="card"><div class="card-title">${ICONS.calendar} 近 4 周运动热力图</div>${heatmap(heatData, { weeks: 4 })}</div>
  `;
};
function renderMeditation() {
  const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] });
  return `<div class="card"><div class="card-title">🧘 冥想计时器 <span class="card-subtitle">今日已冥想 ${today.medMinutes} 分钟</span></div>
    <div class="meditation-timer"><div class="timer-circle-wrap"><div class="breathing-circle ${medRunning ? (breathPhase ? 'breathing-out' : 'breathing-in') : ''}" id="breathCircle"></div><div class="timer-display" id="medDisplay">${formatTime(medSeconds)}</div></div>
    <div class="timer-instruction" id="breathText">${medRunning ? (breathPhase ? '呼气...' : '吸气...') : '点击开始，跟随呼吸节奏'}</div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;"><button class="btn btn-primary" onclick="toggleMed()" id="medBtn">${medRunning?ICO.pause+' 暂停':ICO.play+' 开始冥想'}</button><button class="btn btn-outline" onclick="resetMed()">重置</button><button class="btn btn-success" onclick="saveMed()">${ICO.save} 保存</button></div></div></div>`;
}
function renderWorkout(today) {
  const cats = [...new Set(EXERCISE_LIB.map(e=>e.cat))];
  return `
    <div class="card"><div class="card-title">快速记录 (Keep风格运动库)</div>
      <div class="exercise-library">${cats.map(cat => `<div class="ex-lib-group"><div class="ex-lib-cat">${cat}</div><div class="ex-lib-items">${EXERCISE_LIB.filter(e=>e.cat===cat).map(e => `<div class="ex-lib-item" onclick="quickAddWorkout('${e.name}','${e.icon}',${e.dur})"><span class="ex-lib-icon">${e.icon}</span><span class="ex-lib-name">${e.name}</span><span class="ex-lib-info">${e.dur}min · ${e.cal}kcal</span></div>`).join('')}</div></div>`).join('')}</div>
    </div>
    <div class="card"><div class="card-title">${ICONS.list} 自定义记录</div>
      <div class="form-row-3"><div class="form-group"><label class="field-label">运动类型</label><select id="workoutType">${EXERCISE_LIB.map(w=>`<option value="${w.name}" data-icon="${w.icon}">${w.icon} ${w.name}</option>`).join('')}</select></div><div class="form-group"><label class="field-label">时长（分钟）</label><input type="number" id="workoutMinutes" placeholder="30" min="1"></div><div class="form-group"><label class="field-label">备注</label><input type="text" id="workoutNote" placeholder="感觉如何？"></div></div>
      <button class="btn btn-primary" onclick="addWorkout()">记录锻炼</button>
    </div>
    <div class="card"><div class="card-title">📋 今日锻炼记录 (${today.workouts.length})</div>${today.workouts.length ? today.workouts.map(w => `<div class="task-item-v2"><span style="font-size:20px;">${w.icon||'⭐'}</span><span class="task-text">${esc(w.type)} · ${w.minutes}分钟 ${w.note?`<span class="text-muted">· ${esc(w.note)}</span>`:''}</span><div class="task-actions"><button class="btn-icon" onclick="editWorkout('${w.id}')">${ICO.edit}</button><button class="btn-icon danger" onclick="confirmDelWorkout('${w.id}')">${ICO.trash}</button></div></div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">💪</div><div class="empty-state-v2-text">还没有锻炼记录</div><div class="empty-state-v2-hint">动起来吧！</div></div>'}</div>
  `;
}
function switchExTab(tab) { exerciseTab = tab; medRunning = false; if(medTimer){clearInterval(medTimer);medTimer=null;} if(breathInterval){clearInterval(breathInterval);breathInterval=null;} Nav.refresh(); }
function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function toggleMed() {
  medRunning = !medRunning;
  if (medRunning) {
    medTimer = setInterval(() => { medSeconds++; $('#medDisplay').textContent = formatTime(medSeconds); }, 1000);
    breathInterval = setInterval(() => { breathPhase = 1 - breathPhase; const c = $('#breathCircle'), t = $('#breathText'); if (c) { c.classList.remove('breathing-in','breathing-out'); c.classList.add(breathPhase ? 'breathing-out' : 'breathing-in'); } if (t) t.textContent = breathPhase ? '呼气...' : '吸气...'; }, 4000);
    $('#medBtn').innerHTML = ICO.pause + ' 暂停';
  } else { clearInterval(medTimer); medTimer = null; clearInterval(breathInterval); breathInterval = null; $('#medBtn').innerHTML = ICO.play + ' 继续'; const c = $('#breathCircle'); if (c) c.classList.remove('breathing-in','breathing-out'); const t = $('#breathText'); if (t) t.textContent = '已暂停'; }
}
function resetMed() { medRunning = false; medSeconds = 0; if (medTimer) { clearInterval(medTimer); medTimer = null; } if (breathInterval) { clearInterval(breathInterval); breathInterval = null; } Nav.refresh(); }
function saveMed() {
  if (medSeconds < 60) return toast('至少冥想1分钟再保存', 'warning');
  const minutes = Math.floor(medSeconds / 60); const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] }); today.medMinutes += minutes; Store.setDaily('exercise', today);
  Game.reward(minutes * 3, minutes * 2, minutes, 'strength'); toast(`${minutes}分钟冥想已保存 🧘`, 'success');
  medSeconds = 0; medRunning = false; if (medTimer) { clearInterval(medTimer); medTimer = null; } if (breathInterval) { clearInterval(breathInterval); breathInterval = null; } Nav.refresh();
}
function quickAddWorkout(type, icon, dur) {
  const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] });
  today.workouts.push({ id: uid(), type, icon, minutes: dur, note: '' }); Store.setDaily('exercise', today);
  const ex = EXERCISE_LIB.find(e=>e.name===type); Game.reward(10, 5, 3, 'strength'); Game.data.totalWorkouts = (Game.data.totalWorkouts || 0) + 1; Game.save(); toast(`${type} ${dur}分钟已记录 💪`, 'success'); Nav.refresh();
}
function addWorkout() {
  const sel = $('#workoutType'), type = sel.value, opt = sel.options[sel.selectedIndex], icon = opt.dataset.icon || '⭐', minutes = parseInt($('#workoutMinutes').value) || 0, note = $('#workoutNote').value.trim();
  if (minutes < 1) return toast('请输入运动时长', 'warning');
  const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] }); today.workouts.push({ id: uid(), type, icon, minutes, note }); Store.setDaily('exercise', today);
  Game.reward(10, 5, 3, 'strength'); Game.data.totalWorkouts = (Game.data.totalWorkouts || 0) + 1; Game.save(); toast(`${type} ${minutes}分钟已记录`, 'success'); Nav.refresh();
}
function editWorkout(id) {
  const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] }); const w = today.workouts.find(x => x.id === id); if (!w) return;
  UI.editModal({ title: '编辑锻炼记录', icon: ICONS.run, fields: [{ key: 'type', label: '运动类型', type: 'select', options: EXERCISE_LIB.map(e => ({value: e.name, label: e.name})) }, { key: 'minutes', label: '时长（分钟）', type: 'number', min: 1 }, { key: 'note', label: '备注', type: 'text' }], values: w,
    onSave: (v) => { Object.assign(w, v); w.minutes = parseInt(w.minutes) || 0; Store.setDaily('exercise', today); toast('锻炼记录已更新', 'success'); Nav.refresh(); },
    onDelete: () => { UI.confirm('确定删除这条锻炼记录吗？', () => { today.workouts = today.workouts.filter(x => x.id !== id); Store.setDaily('exercise', today); Nav.refresh(); }); } });
}
function confirmDelWorkout(id) { UI.confirm('确定删除这条锻炼记录吗？', () => { const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] }); today.workouts = today.workouts.filter(w => w.id !== id); Store.setDaily('exercise', today); Nav.refresh(); }); }

// ---------- 好好吃饭 (薄荷健康风格) ----------
const FOOD_DB = [
  { name:'米饭', cal:116, unit:'碗' }, { name:'面条', cal:280, unit:'碗' }, { name:'馒头', cal:223, unit:'个' },
  { name:'面包', cal:313, unit:'片' }, { name:'鸡蛋', cal:73, unit:'个' }, { name:'牛奶', cal:54, unit:'杯' },
  { name:'豆浆', cal:31, unit:'杯' }, { name:'苹果', cal:52, unit:'个' }, { name:'香蕉', cal:89, unit:'根' },
  { name:'鸡胸肉', cal:133, unit:'份' }, { name:'牛肉', cal:125, unit:'份' }, { name:'猪肉', cal:143, unit:'份' },
  { name:'鱼', cal:102, unit:'份' }, { name:'豆腐', cal:81, unit:'份' }, { name:'蔬菜沙拉', cal:150, unit:'份' },
  { name:'炒青菜', cal:90, unit:'份' }, { name:'番茄炒蛋', cal:180, unit:'份' }, { name:'咖啡', cal:2, unit:'杯' },
  { name:'奶茶', cal:300, unit:'杯' }, { name:'汉堡', cal:295, unit:'个' }, { name:'披萨', cal:235, unit:'片' },
  { name:'寿司', cal:150, unit:'份' }, { name:'粥', cal:46, unit:'碗' }, { name:'酸奶', cal:72, unit:'杯' },
];
Modules.food = () => {
  const today = Store.getDaily('food', { meals: [], water: 0 });
  const waterGoal = 8, waterPct = Math.min(100, (today.water||0) / waterGoal * 100);
  const meals = today.meals || [];
  const calGoal = Store.get('wb_cal_goal', 2000);
  const totalCal = meals.reduce((s,m) => s + (m.cal || 0), 0);
  const calPct = Math.min(100, totalCal / calGoal * 100);
  let waterStreak = 0;
  const dates = lastNDays(30);
  for (let i = dates.length - 1; i >= 0; i--) { const f = Store.get(`wb_food_${dates[i]}`, null); if (f && (f.water||0) >= waterGoal) waterStreak++; else if (i < dates.length - 1) break; }
  const mealIcons = { '早餐':'🌅', '午餐':'☀️', '晚餐':'🌆', '零食':'🍪' };
  return `
    <div class="card"><div class="card-title">${ICONS.water} 好好喝水 <span class="card-subtitle">${ICONS.flame} 连续达标 ${waterStreak} 天</span></div>
      <div style="display:flex;align-items:center;gap:24px;"><div class="water-bottle" style="flex-shrink:0;"><div class="water-fill" style="height:${waterPct}%;"></div>${today.water >= waterGoal ? '<div class="water-bubble" style="width:8px;height:8px;left:20%;"></div><div class="water-bubble" style="width:6px;height:6px;left:60%;animation-delay:1s;"></div>' : ''}</div>
      <div style="flex:1;text-align:center;"><div class="water-count">${today.water||0}<span style="font-size:18px;color:var(--text-light);"> / ${waterGoal}</span></div><div class="water-goal">杯水 · ${waterPct.toFixed(0)}% ${today.water>=waterGoal?'🎉 已达标！':''}</div><div class="water-cups" style="margin-top:12px;">${Array.from({length:waterGoal},(_,i)=>`<div class="water-cup ${i<(today.water||0)?'filled':''}" onclick="setWater(${i+1})"></div>`).join('')}</div><div style="display:flex;gap:8px;justify-content:center;margin-top:8px;"><button class="btn btn-outline btn-sm" onclick="addWater(-1)">-1</button><button class="btn btn-primary btn-sm" onclick="addWater(1)">+1 💧</button></div></div></div>
    </div>
    <div class="card"><div class="card-title">${ICONS.flame} 热量追踪 <span class="card-subtitle">目标 ${calGoal} kcal</span></div>
      <div class="cal-track"><div class="cal-track-bar"><div class="cal-track-fill ${calPct>=100?'over':''}" style="width:${Math.min(100,calPct)}%"></div></div><div class="cal-track-text"><span class="cal-track-num">${totalCal}</span> / ${calGoal} kcal ${calPct>=100?'⚠️ 超标':''}</div></div>
      <div style="margin-top:10px;display:flex;gap:8px;align-items:center;"><input type="number" id="calGoalInput" placeholder="目标热量" value="${calGoal}" min="0" style="width:120px;"><button class="btn btn-outline btn-sm" onclick="setCalGoal()">设置目标</button></div>
    </div>
    <div class="card"><div class="card-title">🍽️ 记录饮食</div>
      <div class="form-row-3"><div class="form-group"><label class="field-label">餐次</label><select id="mealType"><option value="早餐">🌅 早餐</option><option value="午餐">☀️ 午餐</option><option value="晚餐">🌆 晚餐</option><option value="零食">🍪 零食</option></select></div><div class="form-group"><label class="field-label">食物</label><input type="text" id="mealFood" placeholder="吃了什么？" list="foodList"></div><div class="form-group"><label class="field-label">热量(kcal)</label><input type="number" id="mealCal" placeholder="自动/手动" min="0"></div></div>
      <datalist id="foodList">${FOOD_DB.map(f=>`<option value="${f.name}">${f.cal}kcal/${f.unit}</option>`).join('')}</datalist>
      <div class="form-group"><label class="field-label">备注</label><input type="text" id="mealNote" placeholder="感受/份量"></div>
      <div class="food-quick-tags">${FOOD_DB.slice(0,12).map(f=>`<span class="food-quick-tag" onclick="quickFillFood('${f.name}',${f.cal})">${f.name} ${f.cal}</span>`).join('')}</div>
      <button class="btn btn-primary" onclick="addMeal()">记录</button>
    </div>
    <div class="card"><div class="card-title">📋 今日饮食时间线 (${meals.length})</div>${meals.length ? `<div class="meal-timeline">${meals.map(m => `<div class="meal-timeline-item"><div class="meal-timeline-header"><div class="meal-timeline-type">${mealIcons[m.type]||'🍽️'} ${esc(m.type)}</div><div class="meal-timeline-time">${esc(m.time||'')} ${m.cal?`· ${m.cal}kcal`:''}</div></div><div class="meal-timeline-food">${esc(m.food)}</div>${m.note ? `<div class="meal-timeline-note">${esc(m.note)}</div>` : ''}<div class="record-actions" style="position:absolute;right:8px;top:8px;"><button class="btn-icon" onclick="editMeal('${m.id}')">${ICO.edit}</button><button class="btn-icon danger" onclick="confirmDelMeal('${m.id}')">${ICO.trash}</button></div></div>`).join('')}</div>` : '<div class="empty-state-v2"><div class="empty-state-v2-icon">🍽️</div><div class="empty-state-v2-text">还没有记录饮食</div><div class="empty-state-v2-hint">记录每一餐，关注自己的饮食健康</div></div>'}</div>
  `;
};
function setCalGoal() { const v = parseInt($('#calGoalInput').value) || 0; if (v < 0) return toast('目标不能为负', 'warning'); Store.set('wb_cal_goal', v); toast('热量目标已设置', 'success'); Nav.refresh(); }
function quickFillFood(name, cal) { $('#mealFood').value = name; $('#mealCal').value = cal; }
function addWater(delta) { const today = Store.getDaily('food', { meals: [], water: 0 }); const old = today.water || 0; today.water = Math.max(0, old + delta); Store.setDaily('food', today); if (old < 8 && today.water >= 8) { Game.reward(10, 5, 3); toast('喝水达标 8 杯 🎉', 'success'); } Nav.refresh(); }
function setWater(n) { const today = Store.getDaily('food', { meals: [], water: 0 }); today.water = n; Store.setDaily('food', today); Nav.refresh(); }
function addMeal() {
  const type = $('#mealType').value, food = $('#mealFood').value.trim(), note = $('#mealNote').value.trim(), cal = parseInt($('#mealCal').value) || 0;
  if (!food) return toast('请输入食物', 'warning');
  const today = Store.getDaily('food', { meals: [], water: 0 }); today.meals.push({ id: uid(), type, food, note, cal, time: nowTime() }); Store.setDaily('food', today);
  toast('饮食已记录 🍽️', 'success'); Nav.refresh();
}
function editMeal(id) {
  const today = Store.getDaily('food', { meals: [], water: 0 }); const m = today.meals.find(x => x.id === id); if (!m) return;
  UI.editModal({ title: '编辑饮食记录', icon: '🍽️', fields: [{ key: 'type', label: '餐次', type: 'select', options: [{value:'早餐',label:'🌅 早餐'},{value:'午餐',label:'☀️ 午餐'},{value:'晚餐',label:'🌆 晚餐'},{value:'零食',label:'🍪 零食'}] }, { key: 'food', label: '食物', type: 'text' }, { key: 'cal', label: '热量(kcal)', type: 'number', min: 0 }, { key: 'note', label: '备注', type: 'text' }], values: m,
    onSave: (v) => { Object.assign(m, v); m.cal = parseInt(m.cal) || 0; Store.setDaily('food', today); toast('饮食记录已更新', 'success'); Nav.refresh(); },
    onDelete: () => { UI.confirm('确定删除这条饮食记录吗？', () => { today.meals = today.meals.filter(x => x.id !== id); Store.setDaily('food', today); Nav.refresh(); }); } });
}
function confirmDelMeal(id) { UI.confirm('确定删除这条饮食记录吗？', () => { const today = Store.getDaily('food', { meals: [], water: 0 }); today.meals = today.meals.filter(m => m.id !== id); Store.setDaily('food', today); Nav.refresh(); }); }

// ---------- 理财记账 ----------
const FINANCE_CATS = { '餐饮': { icon:'🍔', color:'#f59e0b' }, '交通': { icon:'🚗', color:'#3b82f6' }, '购物': { icon:'🛒', color:'#ec4899' }, '娱乐': { icon:'🎮', color:'#8b5cf6' }, '住房': { icon:'🏠', color:'#14b8a6' }, '医疗': { icon:'💊', color:'#ef4444' }, '教育': { icon:'📚', color:'#6366f1' }, '其他': { icon:'📦', color:'#94a3b8' } };
Modules.finance = () => {
  const records = Store.get('wb_finance', []);
  const month = new Date().toISOString().slice(0,7);
  const monthRecords = records.filter(r => r.date.startsWith(month));
  const income = monthRecords.filter(r => r.type==='income').reduce((s,r)=>s+r.amount,0);
  const expense = monthRecords.filter(r => r.type==='expense').reduce((s,r)=>s+r.amount,0);
  const balance = income - expense;
  const budget = Store.get('wb_budget', 3000);
  const budgetPct = budget > 0 ? (expense / budget * 100) : 0;
  const budgetClass = budgetPct >= 90 ? 'danger' : budgetPct >= 70 ? 'warn' : 'safe';
  const catData = Object.entries(FINANCE_CATS).map(([name, info]) => ({ label: name, value: monthRecords.filter(r=>r.cat===name && r.type==='expense').reduce((s,r)=>s+r.amount,0), color: info.color })).filter(d => d.value > 0);
  const dates7 = lastNDays(7);
  const chartData = dates7.map((date, i) => ({ label: dayLabels(7)[i], value: Math.round(records.filter(r => r.type==='expense' && r.date.startsWith(date)).reduce((s,r)=>s+r.amount,0)), today: i===6, color: '#ef4444' }));
  return `
    <div class="finance-summary"><div class="finance-summary-card income"><div class="finance-summary-label">本月收入</div><div class="finance-summary-value">¥${income.toFixed(2)}</div></div><div class="finance-summary-card expense"><div class="finance-summary-label">本月支出</div><div class="finance-summary-value">¥${expense.toFixed(2)}</div></div><div class="finance-summary-card balance"><div class="finance-summary-label">本月结余</div><div class="finance-summary-value">¥${balance.toFixed(2)}</div></div></div>
    <div class="card"><div class="card-title">${ICONS.coin} 记一笔</div>
      <div class="form-row-3"><div class="form-group"><label class="field-label">类型</label><select id="finType"><option value="expense">💸 支出</option><option value="income">💵 收入</option></select></div><div class="form-group"><label class="field-label">分类</label><select id="finCat">${Object.entries(FINANCE_CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${k}</option>`).join('')}</select></div><div class="form-group"><label class="field-label">金额（¥）</label><input type="number" id="finAmount" placeholder="0.00" step="0.01" min="0"></div></div>
      <div class="form-group"><label class="field-label">备注</label><input type="text" id="finNote" placeholder="可选"></div><button class="btn btn-primary" onclick="addFinance()">记录</button>
    </div>
    ${expense > 0 ? `<div class="card"><div class="card-title">🥧 支出分类占比</div>${donutChart(catData, { size: 150, stroke: 24 })}</div>` : ''}
    <div class="card"><div class="card-title">${ICONS.chart} 预算管理</div>
      <div class="flex-between" style="margin-bottom:6px;"><span class="text-sm text-muted">月度预算</span><span class="text-sm" style="font-weight:700;color:var(--text);">¥${expense.toFixed(0)} / ¥${budget}</span></div>
      <div class="budget-bar"><div class="budget-bar-fill ${budgetClass}" style="width:${Math.min(100,budgetPct)}%"></div></div>
      <div class="flex-between" style="margin-top:4px;"><span class="text-xs text-muted">已用 ${budgetPct.toFixed(0)}%</span><span class="text-xs" style="color:${budgetPct>=90?'var(--danger)':'var(--text-light)'}">剩余 ¥${Math.max(0,budget-expense).toFixed(0)}</span></div>
      <div style="margin-top:10px;display:flex;gap:8px;align-items:center;"><input type="number" id="budgetInput" placeholder="设置预算" value="${budget}" min="0" style="width:120px;"><button class="btn btn-outline btn-sm" onclick="setBudget()">设置</button></div>
    </div>
    <div class="card"><div class="card-title">📈 近 7 天消费趋势</div>${barChart(chartData, { height: 80 })}</div>
    <div class="card"><div class="card-title">📋 本月账单 (${monthRecords.length})</div>${monthRecords.length ? monthRecords.slice().reverse().map(r => `<div class="record-item" data-id="${r.id}"><div class="record-icon">${(FINANCE_CATS[r.cat]||{icon:'📦'}).icon}</div><div class="record-info"><div class="record-category">${esc(r.cat)} ${r.note?`· ${esc(r.note)}`:''}</div><div class="record-note">${r.date}</div></div><div class="record-amount ${r.type}">${r.type==='income'?'+':'-'}¥${r.amount.toFixed(2)}</div><div class="record-actions"><button class="btn-icon" onclick="editFinance('${r.id}')">${ICO.edit}</button><button class="btn-icon danger" onclick="confirmDelFinance('${r.id}')">${ICO.trash}</button></div></div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">💰</div><div class="empty-state-v2-text">还没有记账记录</div><div class="empty-state-v2-hint">记下第一笔，掌控你的财务</div></div>'}</div>
  `;
};
function setBudget() { const v = parseInt($('#budgetInput').value) || 0; if (v < 0) return toast('预算不能为负', 'warning'); Store.set('wb_budget', v); toast('预算已设置', 'success'); Nav.refresh(); }
function addFinance() { const type = $('#finType').value, cat = $('#finCat').value, amount = parseFloat($('#finAmount').value), note = $('#finNote').value.trim(); if (!amount || amount <= 0) return toast('请输入有效金额', 'warning'); const records = Store.get('wb_finance', []); records.push({ id: uid(), type, cat, amount, note, date: nowDateTime() }); Store.set('wb_finance', records); toast('记录成功', 'success'); Nav.refresh(); }
function editFinance(id) { const records = Store.get('wb_finance', []); const r = records.find(x => x.id === id); if (!r) return; UI.editModal({ title: '编辑账单', icon: '💰', fields: [{ key: 'type', label: '类型', type: 'select', options: [{value:'expense',label:'💸 支出'},{value:'income',label:'💵 收入'}] }, { key: 'cat', label: '分类', type: 'select', options: Object.entries(FINANCE_CATS).map(([k,v])=>({value:k,label:`${v.icon} ${k}`})) }, { key: 'amount', label: '金额（¥）', type: 'number', min: 0, step: 0.01 }, { key: 'note', label: '备注', type: 'text' }], values: r, onSave: (v) => { Object.assign(r, v); r.amount = parseFloat(r.amount) || 0; Store.set('wb_finance', records); toast('账单已更新', 'success'); Nav.refresh(); }, onDelete: () => { UI.confirm('确定删除这条账单记录吗？', () => { Store.set('wb_finance', records.filter(x => x.id !== id)); Nav.refresh(); }); } }); }
function confirmDelFinance(id) { UI.confirm('确定删除这条账单记录吗？', () => { let records = Store.get('wb_finance', []); records = records.filter(r => r.id !== id); Store.set('wb_finance', records); Nav.refresh(); }); }

// ---------- 自媒体计划 (看板) ----------
const MEDIA_PLATFORMS = ['微信公众号','小红书','抖音','B站','知乎','微博','视频号','快手'];
const MEDIA_STATUSES = [{ key: 'idea', label: '构思中', tag: 'tag-orange' }, { key: 'writing', label: '创作中', tag: 'tag-blue' }, { key: 'ready', label: '待发布', tag: 'tag-green' }, { key: 'published', label: '已发布', tag: 'tag-purple' }];
Modules.media = () => {
  const plans = Store.get('wb_media', []);
  return `
    <div class="compact-stats"><div class="compact-stat"><div class="compact-stat-num" style="color:var(--primary);">${plans.length}</div><div class="compact-stat-label">${ICONS.list} 总计划</div></div><div class="compact-stat"><div class="compact-stat-num" style="color:var(--warning);">${plans.filter(p=>p.status==='idea').length}</div><div class="compact-stat-label">${ICONS.bulb} 构思</div></div><div class="compact-stat"><div class="compact-stat-num" style="color:var(--success);">${plans.filter(p=>p.status==='ready').length}</div><div class="compact-stat-label">${ICONS.check} 待发</div></div><div class="compact-stat"><div class="compact-stat-num" style="color:var(--purple);">${plans.filter(p=>p.status==='published').length}</div><div class="compact-stat-label">${ICONS.rocket} 已发</div></div></div>
    <div class="card"><div class="card-title">${ICO.plus} 添加内容计划</div>
      <div class="form-row-3"><div class="form-group"><label class="field-label">平台</label><select id="mediaPlatform">${MEDIA_PLATFORMS.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></div><div class="form-group"><label class="field-label">计划日期</label><input type="date" id="mediaDate" value="${todayKey()}"></div><div class="form-group"><label class="field-label">状态</label><select id="mediaStatus">${MEDIA_STATUSES.map(s=>`<option value="${s.key}">${s.label}</option>`).join('')}</select></div></div>
      <div class="form-group"><label class="field-label">内容标题</label><input type="text" id="mediaTitle" placeholder="这次想做什么内容？"></div>
      <div class="form-group"><label class="field-label">内容描述</label><textarea id="mediaDesc" placeholder="详细描述内容方向、目标受众等"></textarea></div>
      <button class="btn btn-primary" onclick="addMedia()">添加计划</button>
    </div>
    <div class="card"><div class="card-title">${ICONS.list} 内容看板</div>
      <div class="kanban">${MEDIA_STATUSES.map(s => { const items = plans.filter(p => p.status === s.key); return `<div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title">${s.label}</div><div class="kanban-col-count">${items.length}</div></div>${items.map(p => `<div class="kanban-card" data-id="${p.id}"><div class="kanban-card-title">${esc(p.title)}</div>${p.desc ? `<div class="kanban-card-desc">${esc(p.desc.slice(0,60))}${p.desc.length>60?'...':''}</div>` : ''}<div class="kanban-card-meta"><span class="tag tag-blue">📍 ${esc(p.platform)}</span><span class="text-xs text-muted">📅 ${esc(p.date)}</span></div><div class="kanban-card-actions"><button class="btn-icon" onclick="event.stopPropagation();editMedia('${p.id}')" title="编辑">${ICO.edit}</button>${s.key !== 'published' ? `<button class="btn-icon" onclick="event.stopPropagation();cycleMediaStatus('${p.id}')" title="推进">${ICO.chevronRight}</button>` : ''}<button class="btn-icon danger" onclick="event.stopPropagation();confirmDelMedia('${p.id}')" title="删除">${ICO.trash}</button></div></div>`).join('') || '<div style="text-align:center;padding:20px;color:var(--text-lighter);font-size:12px;">暂无内容</div>'}</div>`; }).join('')}</div>
    </div>
  `;
};
function addMedia() { const platform = $('#mediaPlatform').value, date = $('#mediaDate').value, status = $('#mediaStatus').value, title = $('#mediaTitle').value.trim(), desc = $('#mediaDesc').value.trim(); if (!title) return toast('请输入内容标题', 'warning'); const plans = Store.get('wb_media', []); plans.push({ id: uid(), platform, date, status, title, desc }); Store.set('wb_media', plans); toast('计划已添加 📱', 'success'); Nav.refresh(); }
function cycleMediaStatus(id) { const plans = Store.get('wb_media', []); const p = plans.find(x => x.id === id); if (!p) return; const order = ['idea','writing','ready','published']; const idx = order.indexOf(p.status); if (idx < order.length - 1) { p.status = order[idx+1]; if (p.status === 'published') { Game.reward(15, 10, 3); toast('内容已发布 🚀', 'success'); } else toast(`状态更新: ${MEDIA_STATUSES.find(s=>s.key===p.status).label}`, 'success'); } else { toast('已经是最终状态', 'warning'); return; } Store.set('wb_media', plans); Nav.refresh(); }
function editMedia(id) { const plans = Store.get('wb_media', []); const p = plans.find(x => x.id === id); if (!p) return; UI.editModal({ title: '编辑内容计划', icon: '📱', fields: [{ key: 'title', label: '内容标题', type: 'text' }, { key: 'platform', label: '平台', type: 'select', options: MEDIA_PLATFORMS.map(p=>({value:p,label:p})) }, { key: 'status', label: '状态', type: 'select', options: MEDIA_STATUSES.map(s=>({value:s.key,label:s.label})) }, { key: 'date', label: '计划日期', type: 'date' }, { key: 'desc', label: '内容描述', type: 'textarea' }], values: p, onSave: (v) => { Object.assign(p, v); Store.set('wb_media', plans); toast('计划已更新', 'success'); Nav.refresh(); }, onDelete: () => { UI.confirm(`确定删除「${p.title}」吗？`, () => { Store.set('wb_media', plans.filter(x => x.id !== id)); Nav.refresh(); }); } }); }
function confirmDelMedia(id) { const plans = Store.get('wb_media', []); const p = plans.find(x => x.id === id); if (!p) return; UI.confirm(`确定删除「${p.title}」吗？`, () => { Store.set('wb_media', plans.filter(x => x.id !== id)); Nav.refresh(); }); }

// ---------- 爆款视频 (B站/抖音热门 + 灵感库) ----------
const VIDEO_ELEMENTS = [{ key:'情绪共鸣', tag:'tag-red' }, { key:'反差感', tag:'tag-purple' }, { key:'知识干货', tag:'tag-blue' }, { key:'热点蹭流', tag:'tag-orange' }, { key:'悬念反转', tag:'tag-indigo' }, { key:'治愈暖心', tag:'tag-green' }];
let videoTab = 'bilibili';
function switchVideoTab(tab) { videoTab = tab; Nav.refresh(); }
Modules.video = () => {
  const ideas = Store.get('wb_videos', []);
  const isBili = videoTab === 'bilibili';
  return `
    <div class="card"><div class="flex-between"><div class="card-title" style="margin:0;">🔥 热门视频</div><button class="btn btn-outline btn-sm" onclick="loadOnlineVideos()">${ICO.refresh} 刷新</button></div>
      <div class="plan-tabs" style="margin:10px 0;">
        <button class="plan-tab ${isBili?'active':''}" onclick="switchVideoTab('bilibili')">📺 B站热门</button>
        <button class="plan-tab ${!isBili?'active':''}" onclick="switchVideoTab('douyin')">🎵 抖音热搜</button>
      </div>
      <div id="videoOnline">${isBili ? skelGrid(6) : skelNews(12)}</div>
    </div>
    <div class="card"><div class="card-title">🎬 新增视频灵感</div>
      <div class="form-group"><label class="field-label">视频标题/选题</label><input type="text" id="videoTitle" placeholder="什么样的标题能吸引眼球？"></div>
      <div class="form-row"><div class="form-group"><label class="field-label">平台</label><select id="videoPlatform"><option>抖音</option><option>小红书</option><option>B站</option><option>视频号</option><option>快手</option><option>YouTube</option></select></div><div class="form-group"><label class="field-label">爆款要素</label><select id="videoElement">${VIDEO_ELEMENTS.map(e=>`<option value="${e.key}">${e.key}</option>`).join('')}</select></div></div>
      <div class="form-group"><label class="field-label">脚本结构（Hook → 主体 → 引导）</label><textarea id="videoScript" placeholder="🎯 Hook(开头3秒吸引):\n📝 内容主体(核心价值):\n👉 结尾引导(点赞关注转发):" style="min-height:100px;"></textarea></div>
      <button class="btn btn-primary" onclick="addVideo()">保存灵感</button>
    </div>
    <div class="card"><div class="card-title">📚 灵感库 (${ideas.length})</div>${ideas.length ? ideas.slice().reverse().map(v => { const elem = VIDEO_ELEMENTS.find(e=>e.key===v.element) || VIDEO_ELEMENTS[0]; return `<div class="note-item" data-id="${v.id}"><div class="note-item-title">${esc(v.title)} <span class="tag ${elem.tag}" style="float:right;">🔥 ${esc(v.element)}</span></div>${v.script ? `<div class="note-item-body" style="white-space:pre-wrap;">${esc(v.script)}</div>` : ''}<div class="note-item-meta"><span class="tag tag-blue">📍 ${esc(v.platform)}</span><span>📅 ${esc(v.date)}</span></div><div style="margin-top:8px;display:flex;gap:4px;"><button class="btn btn-outline btn-sm" onclick="editVideo('${v.id}')">编辑</button><button class="btn-icon danger" onclick="confirmDelVideo('${v.id}')">${ICO.trash}</button></div></div>`; }).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">🎬</div><div class="empty-state-v2-text">还没有视频灵感</div><div class="empty-state-v2-hint">记录下你的爆款想法吧</div></div>'}</div>
  `;
};
ModuleHooks.video = () => { loadOnlineVideos(); };
function fallbackBanner() {
  return `<div class="fallback-banner"><span class="fallback-dot"></span>当前区域暂时无法直连国内数据源，已为你展示示例内容 · 在国内云或本机部署可恢复实时数据</div>`;
}
async function loadOnlineVideos() {
  const container = $('#videoOnline'); if (!container) return;
  const isBili = videoTab === 'bilibili';
  container.innerHTML = isBili ? skelGrid(6) : skelNews(12);
  try {
    if (isBili) {
      const r = await API.videos(); const videos = r.items || [];
      if (!videos.length) { container.innerHTML = '<div class="loading-state">暂无数据</div>'; return; }
      window._onlineVideos = videos;
      container.innerHTML = (r.fallback ? fallbackBanner() : '') + `<div class="video-grid">${videos.slice(0, 12).map((v, i) => `<div class="video-card" onclick="window.open('${v.url}')"><div class="video-card-cover" style="background-image:url('${v.cover}')"><div class="video-card-duration">${Math.floor(v.duration/60)}:${String(v.duration%60).padStart(2,'0')}</div></div><div class="video-card-info"><div class="video-card-title">${esc(v.title)}</div><div class="video-card-meta"><span>▶ ${formatNum(v.views)}</span><span>❤ ${formatNum(v.likes)}</span><span>@${esc(v.author)}</span></div></div><button class="btn btn-outline btn-sm video-card-save" onclick="event.stopPropagation();saveVideoFromOnline(${i})">收藏分析</button></div>`).join('')}</div>`;
    } else {
      const r = await API.douyin(); const items = r.items || [];
      if (!items.length) { container.innerHTML = '<div class="loading-state">暂无数据</div>'; return; }
      window._onlineDouyin = items;
      const labelMap = { 1:'🆕', 2:'🔥', 3:'💥', 4:'⭐' };
      container.innerHTML = (r.fallback ? fallbackBanner() : '') + `<div class="news-list">${items.slice(0, 20).map((item, i) => `<div class="news-item" onclick="window.open('${item.url}')"><div class="news-rank rank-${i<3?'top':'normal'}">${i+1}</div><div class="news-content"><div class="news-title">${labelMap[item.label]||''} ${esc(item.title)}</div><div class="news-hot">🔥 ${formatNum(item.hot)}</div></div><button class="btn-icon" onclick="event.stopPropagation();saveDouyinHot(${i})" title="收藏">⭐</button></div>`).join('')}</div>`;
    }
  } catch (e) { container.innerHTML = `<div class="loading-state error">${ICONS.warn} 加载失败，点击 <button class="btn btn-outline btn-sm" onclick="loadOnlineVideos()">重试</button></div>`; }
}
function saveVideoFromOnline(idx) {
  const v = window._onlineVideos?.[idx]; if (!v) return;
  const ideas = Store.get('wb_videos', []);
  if (ideas.find(i => i.title === v.title)) return toast('已收藏过此视频', 'warning');
  ideas.push({ id: uid(), title: v.title, platform: 'B站', element: '热点蹭流', script: `UP主: ${v.author}\n播放: ${formatNum(v.views)} | 点赞: ${formatNum(v.likes)}\n分区: ${v.tname}\n链接: ${v.url}`, date: todayKey() });
  Store.set('wb_videos', ideas);
  Game.reward(5, 3, 0);
  toast('已收藏到灵感库 🎬', 'success');
}
function saveDouyinHot(idx) {
  const item = window._onlineDouyin?.[idx]; if (!item) return;
  const ideas = Store.get('wb_videos', []);
  if (ideas.find(i => i.title === item.title)) return toast('已收藏过此话题', 'warning');
  ideas.push({ id: uid(), title: item.title, platform: '抖音', element: '热点蹭流', script: `抖音热搜 #${item.position}\n热度: ${formatNum(item.hot)}\n链接: ${item.url}`, date: todayKey() });
  Store.set('wb_videos', ideas);
  Game.reward(5, 3, 0);
  toast('已收藏到灵感库 🎬', 'success');
}
function addVideo() { const title = $('#videoTitle').value.trim(), platform = $('#videoPlatform').value, element = $('#videoElement').value, script = $('#videoScript').value.trim(); if (!title) return toast('请输入视频标题', 'warning'); const ideas = Store.get('wb_videos', []); ideas.push({ id: uid(), title, platform, element, script, date: todayKey() }); Store.set('wb_videos', ideas); toast('灵感已保存', 'success'); Nav.refresh(); }
function editVideo(id) { const ideas = Store.get('wb_videos', []); const v = ideas.find(x => x.id === id); if (!v) return; UI.editModal({ title: '编辑视频灵感', icon: '🎬', fields: [{ key: 'title', label: '视频标题/选题', type: 'text' }, { key: 'platform', label: '平台', type: 'select', options: ['抖音','小红书','B站','视频号','快手','YouTube'].map(p=>({value:p,label:p})) }, { key: 'element', label: '爆款要素', type: 'select', options: VIDEO_ELEMENTS.map(e=>({value:e.key,label:e.key})) }, { key: 'script', label: '脚本结构', type: 'textarea', minHeight: 100 }], values: v, onSave: (v2) => { Object.assign(v, v2); Store.set('wb_videos', ideas); toast('灵感已更新', 'success'); Nav.refresh(); }, onDelete: () => { UI.confirm(`确定删除「${v.title.slice(0,30)}」吗？`, () => { Store.set('wb_videos', ideas.filter(x => x.id !== id)); Nav.refresh(); }); } }); }
function confirmDelVideo(id) { const ideas = Store.get('wb_videos', []); const v = ideas.find(x => x.id === id); if (!v) return; UI.confirm(`确定删除「${v.title.slice(0,30)}」吗？`, () => { Store.set('wb_videos', ideas.filter(x => x.id !== id)); Nav.refresh(); }); }

// ---------- 新闻热点 (头条热榜 + 收藏) ----------
Modules.news = () => {
  const saved = Store.get('wb_news', []);
  return `
    <div class="card"><div class="flex-between"><div class="card-title" style="margin:0;">📰 实时热榜</div><button class="btn btn-outline btn-sm" onclick="loadOnlineNews()">${ICO.refresh} 刷新</button></div><div id="newsOnline">${skelNews(10)}</div></div>
    <div class="card"><div class="card-title">📚 我的收藏 (${saved.length})</div>${saved.length ? saved.slice().reverse().map(n => `<div class="note-item" data-id="${n.id}"><div class="note-item-title">${esc(n.title)}</div>${n.note ? `<div class="note-item-body">💬 ${esc(n.note)}</div>` : ''}<div class="note-item-meta">${n.source?`<span>📌 ${esc(n.source)}</span>`:''}<span>📅 ${esc(n.date)}</span></div><div style="margin-top:6px;display:flex;gap:4px;"><button class="btn btn-outline btn-sm" onclick="editNews('${n.id}')">编辑</button><button class="btn-icon danger" onclick="confirmDelNews('${n.id}')">${ICO.trash}</button></div></div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">📰</div><div class="empty-state-v2-text">还没有收藏新闻</div><div class="empty-state-v2-hint">点击热榜旁的 ⭐ 收藏感兴趣的新闻</div></div>'}</div>
  `;
};
ModuleHooks.news = () => { loadOnlineNews(); };
async function loadOnlineNews() {
  const container = $('#newsOnline'); if (!container) return;
  container.innerHTML = skelNews(10);
  try {
    const r = await API.news(); const news = r.items || [];
    if (!news.length) { container.innerHTML = '<div class="loading-state">暂无数据</div>'; return; }
    window._onlineNews = news;
    container.innerHTML = (r.fallback ? fallbackBanner() : '') + `<div class="news-list">${news.map((n, i) => `<div class="news-item" onclick="window.open('${n.url}')"><div class="news-rank ${i<3?'top':''}">${i+1}</div><div class="news-item-content"><div class="news-item-title">${esc(n.title)}</div>${n.hot ? `<div class="news-item-hot">🔥 ${formatNum(n.hot)}</div>` : ''}</div><button class="btn-icon news-save-btn" onclick="event.stopPropagation();saveNewsFromOnline(${i})" title="收藏">⭐</button></div>`).join('')}</div>`;
  } catch (e) { container.innerHTML = `<div class="loading-state error">${ICONS.warn} 加载失败，点击 <button class="btn btn-outline btn-sm" onclick="loadOnlineNews()">重试</button></div>`; }
}
function saveNewsFromOnline(idx) {
  const n = window._onlineNews?.[idx]; if (!n) return;
  const news = Store.get('wb_news', []);
  if (news.find(x => x.title === n.title)) return toast('已收藏过此新闻', 'warning');
  news.push({ id: uid(), title: n.title, cat: '其他', source: '头条热榜', note: '', date: todayKey() });
  Store.set('wb_news', news);
  toast('已收藏 📰', 'success');
}
function editNews(id) { const news = Store.get('wb_news', []); const n = news.find(x => x.id === id); if (!n) return; UI.editModal({ title: '编辑新闻', icon: '📰', fields: [{ key: 'title', label: '新闻标题', type: 'text' }, { key: 'source', label: '来源', type: 'text' }, { key: 'note', label: '我的观点/分析', type: 'textarea' }], values: n, onSave: (v) => { Object.assign(n, v); Store.set('wb_news', news); toast('新闻已更新', 'success'); Nav.refresh(); }, onDelete: () => { UI.confirm(`确定删除「${n.title.slice(0,30)}」吗？`, () => { Store.set('wb_news', news.filter(x => x.id !== id)); Nav.refresh(); }); } }); }
function confirmDelNews(id) { const news = Store.get('wb_news', []); const n = news.find(x => x.id === id); if (!n) return; UI.confirm(`确定删除「${n.title.slice(0,30)}」吗？`, () => { Store.set('wb_news', news.filter(x => x.id !== id)); Nav.refresh(); }); }

// ---------- 新剧分享 (豆瓣热门 + 追剧列表) ----------
let dramaOnlineTab = 'tv';
Modules.drama = () => {
  const dramas = Store.get('wb_dramas', []);
  const watching = dramas.filter(d=>d.status==='watching').length;
  const finished = dramas.filter(d=>d.status==='finished').length;
  const rated = dramas.filter(d=>d.rating>0);
  const avgRating = rated.length ? (rated.reduce((s,d)=>s+d.rating,0)/rated.length).toFixed(1) : '-';
  return `
    <div class="compact-stats"><div class="compact-stat"><div class="compact-stat-num" style="color:var(--success);">${watching}</div><div class="compact-stat-label">📺 在追</div></div><div class="compact-stat"><div class="compact-stat-num" style="color:var(--primary);">${finished}</div><div class="compact-stat-label">✅ 已看完</div></div><div class="compact-stat"><div class="compact-stat-num" style="color:var(--warning);">${avgRating}</div><div class="compact-stat-label">⭐ 平均评分</div></div></div>
    <div class="card"><div class="flex-between"><div class="card-title" style="margin:0;">🎭 豆瓣热门推荐</div><div class="plan-tabs" style="margin:0;"><div class="plan-tab ${dramaOnlineTab==='tv'?'active':''}" onclick="switchDramaTab('tv')">剧集</div><div class="plan-tab ${dramaOnlineTab==='movie'?'active':''}" onclick="switchDramaTab('movie')">电影</div></div></div><div id="dramaOnline">${skelGrid(6)}</div></div>
    <div class="card"><div class="card-title">🎬 我的追剧列表 (${dramas.length})</div>${dramas.length ? dramas.slice().reverse().map(d => { const sm = { watching:{t:'tag-green',l:'📺 在追'}, finished:{t:'tag-blue',l:'✅ 看完'}, planned:{t:'tag-orange',l:'📝 想看'}, dropped:{t:'tag-red',l:'❌ 弃剧'} }; const s = sm[d.status] || sm.planned; const epPct = d.ep && d.ep.includes('/') ? Math.min(100, parseInt(d.ep) / parseInt(d.ep.split('/')[1]) * 100) : 0; return `<div class="note-item" data-id="${d.id}"><div class="note-item-title">${esc(d.title)} <span class="tag ${s.t}" style="float:right;">${s.l}</span></div><div class="note-item-meta"><span class="tag tag-purple">${esc(d.type)}</span>${d.rating ? `<span>${starRating(d.rating)} <span class="text-sm font-bold">${d.rating}/10</span></span>` : ''}${d.ep ? `<span>📺 ${esc(d.ep)}</span>` : ''}</div>${epPct > 0 ? `<div class="book-bar" style="margin-top:6px;"><div class="book-bar-fill" style="width:${epPct}%;background:var(--primary);"></div></div>` : ''}${d.note ? `<div class="note-item-body" style="margin-top:6px;">${esc(d.note)}</div>` : ''}<div style="margin-top:8px;display:flex;gap:4px;"><button class="btn btn-outline btn-sm" onclick="editDrama('${d.id}')">编辑</button><button class="btn-icon danger" onclick="confirmDelDrama('${d.id}')">${ICO.trash}</button></div></div>`; }).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">🎭</div><div class="empty-state-v2-text">还没有追剧记录</div><div class="empty-state-v2-hint">从上方豆瓣推荐中添加，或手动添加</div></div>'}</div>
  `;
};
ModuleHooks.drama = () => { loadOnlineDramas(); };
function switchDramaTab(tab) { dramaOnlineTab = tab; loadOnlineDramas(); }
async function loadOnlineDramas() {
  const container = $('#dramaOnline'); if (!container) return;
  container.innerHTML = skelGrid(6);
  try {
    const r = dramaOnlineTab === 'tv' ? await API.dramas() : await API.movies(); const items = r.items || [];
    if (!items.length) { container.innerHTML = '<div class="loading-state">暂无数据</div>'; return; }
    window._onlineDramas = items;
    container.innerHTML = (r.fallback ? fallbackBanner() : '') + `<div class="online-grid">${items.map((d, i) => `<div class="online-card" onclick="window.open('${d.url}')"><div class="online-card-cover" style="background-image:url('${d.cover}');background-size:cover;background-position:center;"></div><div class="online-card-title">${esc(d.title)}</div><div class="online-card-rate">${d.rate && d.rate !== '暂无' ? `⭐ ${d.rate}` : '暂无评分'}</div>${d.episodes ? `<div class="online-card-ep">${esc(d.episodes)}</div>` : ''}<button class="btn btn-outline btn-sm" style="margin-top:6px;width:100%;" onclick="event.stopPropagation();addDramaFromOnline(${i})">加入追剧</button></div>`).join('')}</div>`;
  } catch (e) { container.innerHTML = `<div class="loading-state error">${ICONS.warn} 加载失败，点击 <button class="btn btn-outline btn-sm" onclick="loadOnlineDramas()">重试</button></div>`; }
}
function addDramaFromOnline(idx) {
  const d = window._onlineDramas?.[idx]; if (!d) return;
  const dramas = Store.get('wb_dramas', []);
  if (dramas.find(x => x.title === d.title)) return toast('已在追剧列表中', 'warning');
  dramas.push({ id: uid(), title: d.title, type: dramaOnlineTab === 'tv' ? '国产剧' : '电影', status: 'planned', rating: parseFloat(d.rate) || 0, ep: '', note: '', date: todayKey() });
  Store.set('wb_dramas', dramas);
  toast(`《${d.title}》已加入追剧列表`, 'success');
}
function addDrama() { const title = $('#dramaTitle').value.trim(); if (!title) return toast('请输入剧名', 'warning'); const dramas = Store.get('wb_dramas', []); dramas.push({ id: uid(), title, type: $('#dramaType').value, status: $('#dramaStatus').value, rating: parseFloat($('#dramaRating').value) || 0, ep: $('#dramaEp').value.trim(), note: $('#dramaNote').value.trim(), date: todayKey() }); Store.set('wb_dramas', dramas); toast('已添加', 'success'); Nav.refresh(); }
function editDrama(id) { const dramas = Store.get('wb_dramas', []); const d = dramas.find(x => x.id === id); if (!d) return; UI.editModal({ title: '编辑剧集', icon: '🎭', fields: [{ key: 'title', label: '剧名', type: 'text' }, { key: 'type', label: '类型', type: 'select', options: ['国产剧','美剧','日剧','韩剧','英剧','动漫','综艺','纪录片','电影'].map(t=>({value:t,label:t})) }, { key: 'status', label: '状态', type: 'select', options: [{value:'watching',label:'📺 在追'},{value:'finished',label:'✅ 看完'},{value:'planned',label:'📝 想看'},{value:'dropped',label:'❌ 弃剧'}] }, { key: 'rating', label: '评分（1-10）', type: 'number', min: 1, max: 10, step: 0.1 }, { key: 'ep', label: '当前集数', type: 'text' }, { key: 'note', label: '观后感/推荐理由', type: 'textarea' }], values: d, onSave: (v) => { Object.assign(d, v); d.rating = parseFloat(d.rating) || 0; Store.set('wb_dramas', dramas); toast('剧集信息已更新', 'success'); Nav.refresh(); }, onDelete: () => { UI.confirm(`确定删除「${d.title}」吗？`, () => { Store.set('wb_dramas', dramas.filter(x => x.id !== id)); Nav.refresh(); }); } }); }
function confirmDelDrama(id) { const dramas = Store.get('wb_dramas', []); const d = dramas.find(x => x.id === id); if (!d) return; UI.confirm(`确定删除「${d.title}」吗？`, () => { Store.set('wb_dramas', dramas.filter(x => x.id !== id)); Nav.refresh(); }); }

// ---------- 理财知识 (每日推荐 + 知识库) ----------
const FIN_KNOWLEDGE_CATS = ['股票','基金','ETF','债券','可转债','期权','外汇','Crypto','宏观经济','保险','税务','技术分析','其他'];
const MASTERY_LEVELS = ['了解概念','初步理解','能复述','能应用','精通'];
Modules.knowledge = () => {
  const notes = Store.get('wb_finknow', []);
  return `
    <div class="card"><div class="flex-between"><div class="card-title" style="margin:0;">${ICONS.chart} 今日理财知识推荐</div><button class="btn btn-outline btn-sm" onclick="loadOnlineFinance()">${ICO.refresh} 换一批</button></div><div id="financeOnline"><div class="loading-state">${ICONS.chart} 正在获取今日理财知识...</div></div></div>
    <div class="card"><div class="card-title">📚 记录理财知识</div>
      <div class="form-group"><label class="field-label">知识点标题</label><input type="text" id="fkTitle" placeholder="如：定投策略、PE估值法等"></div>
      <div class="form-row"><div class="form-group"><label class="field-label">分类</label><select id="fkCat">${FIN_KNOWLEDGE_CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div><div class="form-group"><label class="field-label">掌握程度</label><select id="fkLevel">${MASTERY_LEVELS.map((l,i)=>`<option value="${i}">${l}</option>`).join('')}</select></div></div>
      <div class="form-group"><label class="field-label">详细笔记</label><textarea id="fkContent" placeholder="详细记录知识点内容、案例、心得..." style="min-height:100px;"></textarea></div>
      <button class="btn btn-primary" onclick="addFK()">保存知识</button>
    </div>
    <div class="card"><div class="card-title">📚 我的知识库 (${notes.length})</div>${notes.length ? notes.slice().reverse().map(n => `<div class="note-item" data-id="${n.id}"><div class="note-item-title">${esc(n.title)}</div><div class="note-item-meta"><span class="tag tag-blue">${esc(n.cat)}</span><span>📅 ${esc(n.date)}</span></div><div style="margin-top:8px;"><div class="flex-between text-xs text-muted"><span>掌握度</span><span>${MASTERY_LEVELS[n.level]||MASTERY_LEVELS[0]}</span></div><div class="mastery-bar"><div class="mastery-bar-fill l${n.level}" style="width:${(n.level+1)*20}%"></div></div></div>${n.content ? `<div class="note-item-body" style="margin-top:8px;white-space:pre-wrap;">${esc(n.content)}</div>` : ''}<div style="margin-top:8px;display:flex;gap:4px;"><button class="btn btn-outline btn-sm" onclick="editFK('${n.id}')">编辑</button>${n.level < 4 ? `<button class="btn btn-soft btn-sm" onclick="upgradeFK('${n.id}')">提升掌握 →</button>` : ''}<button class="btn-icon danger" onclick="confirmDelFK('${n.id}')">${ICO.trash}</button></div></div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">📊</div><div class="empty-state-v2-text">还没有知识笔记</div><div class="empty-state-v2-hint">从上方推荐中收藏，或手动添加</div></div>'}</div>
  `;
};
ModuleHooks.knowledge = () => { loadOnlineFinance(); };
async function loadOnlineFinance() {
  const container = $('#financeOnline'); if (!container) return;
  container.innerHTML = '<div class="loading-state">${ICONS.chart} 正在获取今日理财知识...</div>';
  try {
    API._cache.finance = null; // Force refresh for "换一批"
    const items = await API.finance();
    if (!items || !items.length) { container.innerHTML = '<div class="loading-state">暂无数据</div>'; return; }
    window._onlineFinance = items;
    const diffIcons = ['入门','进阶','高级'];
    container.innerHTML = items.map((f, i) => `<div class="finance-card"><div class="finance-card-header"><div class="finance-card-title">${esc(f.title)}</div><div class="finance-card-tags"><span class="tag tag-blue">${esc(f.category)}</span><span class="tag ${f.difficulty===1?'tag-green':f.difficulty===2?'tag-orange':'tag-red'}">${diffIcons[f.difficulty-1]}</span></div></div><div class="finance-card-content">${esc(f.content)}</div><div class="finance-card-tip">💡 ${esc(f.tip)}</div><button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="saveFKFromOnline(${i})">收藏到知识库</button></div>`).join('');
  } catch (e) { container.innerHTML = `<div class="loading-state error">${ICONS.warn} 加载失败，点击 <button class="btn btn-outline btn-sm" onclick="loadOnlineFinance()">重试</button></div>`; }
}
function saveFKFromOnline(idx) {
  const f = window._onlineFinance?.[idx]; if (!f) return;
  const notes = Store.get('wb_finknow', []);
  if (notes.find(n => n.title === f.title)) return toast('已收藏过此知识点', 'warning');
  notes.push({ id: uid(), title: f.title, cat: f.category, level: 0, content: f.content + '\n\n💡 ' + f.tip, date: todayKey() });
  Store.set('wb_finknow', notes);
  Game.reward(5, 3, 0);
  toast('已收藏到知识库 📚', 'success');
}
function addFK() { const title = $('#fkTitle').value.trim(), cat = $('#fkCat').value, level = parseInt($('#fkLevel').value), content = $('#fkContent').value.trim(); if (!title) return toast('请输入知识点标题', 'warning'); const notes = Store.get('wb_finknow', []); notes.push({ id: uid(), title, cat, level, content, date: todayKey() }); Store.set('wb_finknow', notes); toast('知识已记录 📚', 'success'); Nav.refresh(); }
function editFK(id) { const notes = Store.get('wb_finknow', []); const n = notes.find(x => x.id === id); if (!n) return; UI.editModal({ title: '编辑知识点', icon: '📚', fields: [{ key: 'title', label: '知识点标题', type: 'text' }, { key: 'cat', label: '分类', type: 'select', options: FIN_KNOWLEDGE_CATS.map(c=>({value:c,label:c})) }, { key: 'level', label: '掌握程度', type: 'select', options: MASTERY_LEVELS.map((l,i)=>({value:i,label:l})) }, { key: 'content', label: '详细笔记', type: 'textarea', minHeight: 100 }], values: { ...n, level: String(n.level) }, onSave: (v) => { Object.assign(n, v); n.level = parseInt(n.level) || 0; Store.set('wb_finknow', notes); toast('知识点已更新', 'success'); Nav.refresh(); }, onDelete: () => { UI.confirm(`确定删除「${n.title.slice(0,30)}」吗？`, () => { Store.set('wb_finknow', notes.filter(x => x.id !== id)); Nav.refresh(); }); } }); }
function upgradeFK(id) { const notes = Store.get('wb_finknow', []); const n = notes.find(x => x.id === id); if (!n) return; if (n.level < 4) { n.level++; Store.set('wb_finknow', notes); Game.reward(5, 3, 0); toast(`掌握度提升: ${MASTERY_LEVELS[n.level]}`, 'success'); Nav.refresh(); } else toast('已经精通了', 'warning'); }
function confirmDelFK(id) { const notes = Store.get('wb_finknow', []); const n = notes.find(x => x.id === id); if (!n) return; UI.confirm(`确定删除「${n.title.slice(0,30)}」吗？`, () => { Store.set('wb_finknow', notes.filter(x => x.id !== id)); Nav.refresh(); }); }

// ---------- 每日复盘 ----------
Modules.review = () => {
  const today = Store.getDaily('review', null);
  const history = Store.get('wb_review_history', []);
  const moods = ['😴','😐','🙂','😊','🤩'];
  const moodLabels = ['疲惫','一般','还行','开心','超赞'];
  let streak = 0;
  const dates = lastNDays(60);
  for (let i = dates.length - 1; i >= 0; i--) { const r = Store.get(`wb_review_${dates[i]}`, null); if (r && r.good) streak++; else if (i < dates.length - 1) break; }
  const dates7 = lastNDays(7);
  const moodData = dates7.map((date, i) => { const r = Store.get(`wb_review_${date}`, null); return { date, mood: r?.mood ?? null, hasReview: !!r }; });
  return `
    <div class="reading-streak-banner" style="background:linear-gradient(135deg,#fef3c7,#fde6c4);"><div class="reading-streak-flame">${streak > 0 ? ICONS.pen : ICONS.notebook}</div><div class="reading-streak-info"><div class="reading-streak-num" style="color:var(--primary);">${streak} 天连续复盘</div><div class="reading-streak-text">${streak > 0 ? '复盘是成长的加速器，继续保持！' : '今天开始记录你的成长吧'}</div></div></div>
    <div class="card"><div class="card-title">${ICONS.notebook} 今日复盘 · ${todayKey()}</div>
      <div class="form-group"><label class="field-label">今天的心情</label><div class="mood-selector" id="moodSelector">${moods.map((m,i) => `<div class="mood-option ${today?.mood===i?'selected':''}" data-mood="${i}" title="${moodLabels[i]}">${m}</div>`).join('')}</div></div>
      <div class="form-group"><label class="field-label">${ICONS.check} 今天做对了什么？</label><textarea id="reviewGood" placeholder="记录今天做得好的事情">${esc(today?.good||'')}</textarea></div>
      <div class="form-group"><label class="field-label">${ICONS.close} 今天有什么不足？</label><textarea id="reviewBad" placeholder="哪里可以做得更好？">${esc(today?.bad||'')}</textarea></div>
      <div class="form-group"><label class="field-label">${ICONS.bulb} 学到了什么？</label><textarea id="reviewLearn" placeholder="今天的收获和感悟">${esc(today?.learn||'')}</textarea></div>
      <div class="form-group"><label class="field-label">🙏 感恩的事</label><textarea id="reviewThanks" placeholder="感谢今天遇到的人或事">${esc(today?.thanks||'')}</textarea></div>
      <div class="form-group"><label class="field-label">${ICONS.target} 明天计划</label><textarea id="reviewPlan" placeholder="明天要做什么？">${esc(today?.plan||'')}</textarea></div>
      <button class="btn btn-primary" onclick="saveReview()">保存复盘</button>
    </div>
    <div class="card"><div class="card-title">📈 近 7 天心情趋势</div><div class="mood-chart">${moodData.map((d, i) => { const mood = d.mood !== null ? moods[d.mood] : '○'; return `<div class="mood-chart-item"><div class="mood-chart-emoji ${d.mood!==null?'active':''}">${mood}</div><div class="mood-chart-day">${dayLabels(7)[i]}</div></div>`; }).join('')}</div></div>
    <div class="card"><div class="card-title">📅 复盘历史 (${history.length})</div>${history.length ? history.slice().reverse().slice(0,15).map(h => `<div class="note-item" data-id="${h.date}"><div class="note-item-title">${esc(h.date)} ${h.mood!==undefined && h.mood!==null ? moods[h.mood] : ''}<div class="record-actions"><button class="btn-icon" onclick="editReviewHistory('${h.date}')">${ICO.edit}</button></div></div>${h.good?`<div class="note-item-body">✅ ${esc(h.good)}</div>`:''}${h.bad?`<div class="note-item-body">❌ ${esc(h.bad)}</div>`:''}${h.learn?`<div class="note-item-body">💡 ${esc(h.learn)}</div>`:''}</div>`).join('') : '<div class="empty-state text-muted text-sm">还没有复盘历史</div>'}</div>
  `;
};
let selectedMood = null;
ModuleHooks.review = () => {
  const today = Store.getDaily('review', null);
  selectedMood = today?.mood ?? null;
  $$('#moodSelector .mood-option').forEach(el => { el.addEventListener('click', () => { $$('#moodSelector .mood-option').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); selectedMood = parseInt(el.dataset.mood); }); });
};
function saveReview() {
  const data = { mood: selectedMood, good: $('#reviewGood').value.trim(), bad: $('#reviewBad').value.trim(), learn: $('#reviewLearn').value.trim(), thanks: $('#reviewThanks').value.trim(), plan: $('#reviewPlan').value.trim() };
  Store.setDaily('review', data);
  const history = Store.get('wb_review_history', []); const today = todayKey();
  const idx = history.findIndex(h => h.date === today);
  if (idx >= 0) history[idx] = { date: today, ...data }; else history.push({ date: today, ...data });
  Store.set('wb_review_history', history);
  Game.reward(15, 8, 3, 'discipline');
  toast('今日复盘已保存', 'success'); Nav.refresh();
}
function editReviewHistory(date) {
  const history = Store.get('wb_review_history', []); const h = history.find(x => x.date === date); if (!h) return;
  const moods = ['😴','😐','🙂','😊','🤩'], moodLabels = ['疲惫','一般','还行','开心','超赞'];
  UI.editModal({ title: `编辑复盘 · ${date}`, icon: '📝', fields: [{ key: 'mood', label: '心情', type: 'select', options: moodLabels.map((l,i)=>({value:i,label:`${moods[i]} ${l}`})) }, { key: 'good', label: '今天做对了什么？', type: 'textarea' }, { key: 'bad', label: '今天有什么不足？', type: 'textarea' }, { key: 'learn', label: '学到了什么？', type: 'textarea' }, { key: 'thanks', label: '感恩的事', type: 'textarea' }, { key: 'plan', label: '明天计划', type: 'textarea' }], values: { ...h, mood: String(h.mood ?? '') }, onSave: (v) => { Object.assign(h, v); h.mood = h.mood !== '' ? parseInt(h.mood) : null; Store.set('wb_review_history', history); if (date === todayKey()) Store.setDaily('review', { ...h }); toast('复盘已更新', 'success'); Nav.refresh(); } });
}

// ---------- 周报 / 月报 (数据可视化) ----------
let reportRange = 'week'; // week | month
function switchReportRange(r) { reportRange = r; Nav.refresh(); }

Modules.reports = () => {
  const n = reportRange === 'week' ? 7 : 30;
  const dates = lastNDays(n);
  const checkIns = Game.data.checkInDates || [];
  const finances = Store.get('wb_finance', []);
  const finInRange = finances.filter(f => dates.includes(f.date.slice(0, 10)));

  const series = dates.map(date => {
    const plan = Store.get(`wb_plan_${date}`, []) || [];
    const done = plan.filter(t => t.done).length;
    const ex = Store.get(`wb_exercise_${date}`, { medMinutes: 0, workouts: [] });
    const exMin = (ex.medMinutes || 0) + (ex.workouts || []).reduce((s, w) => s + (w.minutes || 0), 0);
    const rd = Store.get(`wb_reading_${date}`, { pages: 0, minutes: 0 });
    const pages = rd.pages || 0;
    const pomo = Store.get(`wb_pomo_${date}`, { count: 0 });
    const pomoCount = pomo.count || 0;
    const checked = checkIns.includes(date) ? 1 : 0;
    const score = done * 2 + exMin * 0.5 + pages * 0.3 + pomoCount * 3 + checked * 5;
    const M = +date.slice(5, 7), D = +date.slice(8, 10);
    return { date, label: `${M}/${D}`, done, exMin, pages, pomoCount, checked, score: Math.round(score) };
  });

  const sum = (k) => series.reduce((s, x) => s + x[k], 0);
  const checkDays = sum('checked');
  const totalDone = sum('done');
  const totalEx = sum('exMin');
  const totalPages = sum('pages');
  const totalPomo = sum('pomoCount');

  const expenseByCat = {};
  let totalExpense = 0, totalIncome = 0;
  finInRange.forEach(f => {
    if (f.type === 'expense') { totalExpense += f.amount; expenseByCat[f.cat] = (expenseByCat[f.cat] || 0) + f.amount; }
    else { totalIncome += f.amount; }
  });
  const donutData = Object.entries(expenseByCat).map(([cat, val]) => ({ label: cat, value: val, color: (FINANCE_CATS[cat] || {}).color || '#94a3b8' }));

  const attrRadar = ATTRIBUTES.map(a => {
    const ad = Game.data.attributes[a.key] || { lv: 1, exp: 0 };
    const total = attrTotalExp(ad);
    return { label: a.name, value: Math.min(100, Math.round(total / 600 * 100)), color: a.color };
  });

  const rangeLabel = reportRange === 'week' ? '近 7 天' : '近 30 天';
  const startDate = dates[0].slice(5).replace('-', '/'), endDate = dates[dates.length - 1].slice(5).replace('-', '/');

  const stats = [
    { icon: ICONS.calendar, label: '打卡天数', val: `${checkDays}/${n}`, color: 'var(--primary)' },
    { icon: ICONS.check, label: '完成任务', val: totalDone, color: 'var(--success)' },
    { icon: ICONS.run, label: '运动分钟', val: totalEx, color: 'var(--warning)' },
    { icon: ICONS.book, label: '阅读页数', val: totalPages, color: 'var(--purple)' },
    { icon: ICONS.tomato, label: '专注番茄', val: totalPomo, color: 'var(--danger)' },
    { icon: ICONS.coin, label: '区间花费', val: '¥' + totalExpense.toFixed(0), color: 'var(--teal)' },
  ];

  const avg = Math.round(series.reduce((s, x) => s + x.score, 0) / n);
  const best = series.reduce((a, b) => b.score > a.score ? b : a);
  const active = series.filter(s => s.score > 0);
  const worst = active.length ? active.reduce((a, b) => b.score < a.score ? b : a) : null;
  const missed = series.filter(s => !s.checked && s.date !== todayKey());
  const pairs = series.filter(s => s.exMin > 0 && s.pages > 0);
  let corr = null;
  if (pairs.length >= 3) {
    const mx = pairs.reduce((s, x) => s + x.exMin, 0) / pairs.length;
    const my = pairs.reduce((s, x) => s + x.pages, 0) / pairs.length;
    let num = 0, dx = 0, dy = 0;
    pairs.forEach(x => { num += (x.exMin - mx) * (x.pages - my); dx += (x.exMin - mx) ** 2; dy += (x.pages - my) ** 2; });
    corr = (dx && dy) ? num / Math.sqrt(dx * dy) : 0;
  }
  const insights = [];
  insights.push(`<li class="insight-item"><b>最佳状态日</b>：${best.label}（活力值 ${best.score}），状态拉满，保持这种节奏。</li>`);
  if (worst) insights.push(`<li class="insight-item"><b>最懈怠的一天</b>：${worst.label}（活力值仅 ${worst.score}），那天是不是有点放松？明天补回来。</li>`);
  if (missed.length) insights.push(`<li class="insight-item"><b>漏打卡 ${missed.length} 天</b>：${missed.slice(0, 3).map(s => s.label).join('、')}${missed.length > 3 ? ' 等' : ''}，连续打卡最易断在"忘了"，固定一个时间更稳。</li>`);
  else insights.push(`<li class="insight-item"><b>打卡全勤</b>：区间内每天都打卡，非常自律！</li>`);
  if (corr !== null) {
    const lvl = corr > 0.5 ? '明显正相关' : corr > 0.2 ? '弱正相关' : corr < -0.2 ? '此消彼长' : '关联不明显';
    insights.push(`<li class="insight-item"><b>运动 × 阅读</b>：${lvl}（相关系数 ${corr.toFixed(2)}）。${corr > 0.3 ? '运动日往往也读得更多，把两者安排在同一时段试试。' : corr < -0.3 ? '运动多的日子阅读偏少，注意别顾此失彼。' : '两者暂无强关联，按需安排即可。'}</li>`);
  }
  insights.push(avg >= 30 ? `<li class="insight-item"><b>整体优秀</b>：区间日均活力 ${avg}，已养成稳定好习惯。</li>` : avg >= 15 ? `<li class="insight-item"><b>稳步提升</b>：区间日均活力 ${avg}，再坚持一周就能看到明显变化。</li>` : `<li class="insight-item"><b>刚刚起步</b>：区间日均活力 ${avg}，先保证每天打卡，习惯会自己长出来。</li>`);
  const insightHtml = insights.join('');

  return `
    <div class="plan-subnav" style="margin-bottom:16px;">
      <div class="plan-sub ${reportRange === 'week' ? 'active' : ''}" onclick="switchReportRange('week')">${ICONS.chart} 周报</div>
      <div class="plan-sub ${reportRange === 'month' ? 'active' : ''}" onclick="switchReportRange('month')">${ICONS.calendar} 月报</div>
      <div class="plan-sub-spacer"></div>
      <div class="text-muted text-sm" style="font-weight:600;">${rangeLabel} · ${startDate} – ${endDate}</div>
    </div>

    <div class="grid-3 report-stats">
      ${stats.map(s => `<div class="card report-stat"><div class="report-stat-icon">${s.icon}</div><div class="report-stat-val" style="color:${s.color}">${s.val}</div><div class="report-stat-label">${s.label}</div></div>`).join('')}
    </div>

    <div class="card insight-card" style="margin-top:16px;">
      <div class="card-title">${ICONS.bulb} 智能洞察 <span class="card-subtitle">${rangeLabel}专属分析</span></div>
      <ul class="insight-list">${insightHtml}</ul>
    </div>

    <div class="grid-2 report-charts" style="margin-top:16px;">
      <div class="card">
        <div class="card-title">📈 每日完成任务 <span class="card-subtitle">${totalDone} 项 / ${rangeLabel}</span></div>
        <div style="overflow-x:auto;">${barChart(series.map(s => ({ label: s.label, value: s.done, today: s.date === todayKey() })), { height: 130 })}</div>
      </div>
      <div class="card">
        <div class="card-title">${ICONS.flame} 活力趋势 <span class="card-subtitle">综合打卡/运动/阅读/专注</span></div>
        <div style="overflow-x:auto;">${lineChart(series.map(s => ({ label: s.label, value: s.score })), { height: 150, color: '#8b5cf6', max: Math.max(...series.map(s => s.score), 1) })}</div>
      </div>
    </div>

    <div class="grid-2 report-charts" style="margin-top:16px;">
      <div class="card">
        <div class="card-title">${ICONS.coin} 记账分类占比 <span class="card-subtitle">支出 ¥${totalExpense.toFixed(0)} · 收入 ¥${totalIncome.toFixed(0)}</span></div>
        ${donutData.length ? donutChart(donutData, { size: 150, stroke: 22 }) : '<div class="empty-state-v2"><div class="empty-state-v2-icon">💰</div><div class="empty-state-v2-text">该区间还没有记账记录</div><div class="empty-state-v2-hint">记一笔开销或收入开始吧</div></div>'}
      </div>
      <div class="card">
        <div class="card-title">${ICONS.star} 个人属性快照 <span class="card-subtitle">当前五项属性</span></div>
        <div style="display:flex;justify-content:center;">${radarChart(attrRadar, { size: 240 })}</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-title">${ICONS.list} 区间明细</div>
      <div class="report-table">
        <div class="report-tr report-th"><div>日期</div><div>打卡</div><div>任务</div><div>运动</div><div>阅读</div><div>专注</div></div>
        ${series.slice().reverse().map(s => `<div class="report-tr"><div>${s.label}${s.date === todayKey() ? ' ·今' : ''}</div><div>${s.checked ? ICONS.check : '—'}</div><div>${s.done}</div><div>${s.exMin}′</div><div>${s.pages}p</div><div>${s.pomoCount}${ICONS.tomato}</div></div>`).join('')}
      </div>
    </div>
  `;
};

// ---------- 番茄专注 (LifeUp 风格番茄钟) ----------
let pomoSeconds = 0, pomoRunning = false, pomoTimer = null, pomoMode = 'focus', pomoTaskId = null;
const POMO_PRESETS = [
  { mode: 'focus', label: '🎯 专注', minutes: 25, color: '#ef4444' },
  { mode: 'short', label: '☕ 短休', minutes: 5, color: '#10b981' },
  { mode: 'long', label: '🛋️ 长休', minutes: 15, color: '#3b82f6' },
];
Modules.pomo = () => {
  const today = Store.getDaily('pomo', { count: 0, sessions: [] });
  const d = Game.data;
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const targetSec = POMO_PRESETS.find(p => p.mode === pomoMode).minutes * 60;
  const preset = POMO_PRESETS.find(p => p.mode === pomoMode);
  const todaySessions = today.sessions || [];
  const _planTasks = getPlan(todayKey()).filter(t => !t.done);
  const todayTasksOpts = _planTasks.map(t => `<option value="${t.id}" ${pomoTaskId === t.id ? 'selected' : ''}>${esc(t.text.slice(0, 24))}</option>`).join('');
  const totalFocusMin = todaySessions.filter(s => s.mode === 'focus').reduce((sum, s) => sum + s.minutes, 0);
  return `
    <div class="pomo-container">
      <div class="pomo-modes">${POMO_PRESETS.map(p => `<div class="pomo-mode ${pomoMode===p.mode?'active':''}" style="${pomoMode===p.mode?`border-color:${p.color};color:${p.color}`:''}" onclick="switchPomoMode('${p.mode}')">${p.label} ${p.minutes}min</div>`).join('')}</div>
      <div class="pomo-timer-wrap">
        <div class="pomo-ring ${pomoRunning?'running':''}" style="--pomo-color:${preset.color}">
          <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" stroke-width="8" opacity="0.15"/><circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="565.5" stroke-dashoffset="${565.5 * (1 - pomoSeconds / targetSec)}" transform="rotate(-90 100 100)" style="transition:stroke-dashoffset 1s linear;"/></svg>
          <div class="pomo-display" style="color:${preset.color}">${fmt(pomoRunning ? targetSec - pomoSeconds : targetSec)}</div>
          <div class="pomo-label">${pomoRunning ? '专注中...' : '准备开始'}</div>
        </div>
        <div class="pomo-controls">
          <button class="btn btn-primary" onclick="togglePomo()" id="pomoBtn">${pomoRunning ? ICO.pause + ' 暂停' : ICO.play + ' 开始'}</button>
          <button class="btn btn-outline" onclick="resetPomo()">重置</button>
          ${pomoRunning && pomoMode === 'focus' ? '<button class="btn btn-success" onclick="completePomo()">'+ICONS.check+' 提前完成</button>' : ''}
        </div>
      </div>
      ${pomoMode === 'focus' ? `<div class="card pomo-task-card"><div class="card-title">${ICONS.target} 关联今日任务</div><div class="pomo-task-row"><select id="pomoTaskSel" class="form-input" onchange="setPomoTask(this.value)"><option value="">不关联任务</option>${todayTasksOpts}</select></div><div class="pomo-task-hint">专注结束后会自动完成所选任务并计入奖励${pomoTaskId ? '（当前已关联）' : ''}</div></div>` : ''}
      <div class="compact-stats">
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--danger);">${today.count || 0}</div><div class="compact-stat-label">${ICONS.tomato} 今日番茄</div></div>
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--primary);">${totalFocusMin}</div><div class="compact-stat-label">${ICONS.clock} 专注分钟</div></div>
        <div class="compact-stat"><div class="compact-stat-num" style="color:var(--success);">${d.pomodoros || 0}</div><div class="compact-stat-label">${ICONS.medal} 累计番茄</div></div>
      </div>
      <div class="card"><div class="card-title">${ICONS.list} 今日番茄记录</div>${todaySessions.length ? todaySessions.slice().reverse().map(s => `<div class="task-item-v2"><span style="font-size:18px;color:var(--danger);">${ICONS.tomato}</span><span class="task-text">${POMO_PRESETS.find(p=>p.mode===s.mode)?.label || s.mode} · ${s.minutes}分钟 ${s.task ? `· ${esc(s.task)}` : ''}</span><span class="text-muted text-sm">${esc(s.time || '')}</span></div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">'+ICONS.tomato+'</div><div class="empty-state-v2-text">还没有完成番茄钟</div><div class="empty-state-v2-hint">开始你的第一个 25 分钟专注吧</div></div>'}</div>
      <div class="card"><div class="card-title">${ICONS.bulb} 番茄工作法</div><div class="note-item-body" style="font-size:13px;line-height:1.8;">1. 选择一个任务，设定 25 分钟专注时间<br>2. 专注期间不看手机、不分心<br>3. 铃声响起，休息 5 分钟<br>4. 每完成 4 个番茄钟，休息 15-30 分钟<br>5. 专注时只做一件事，休息时真正放松</div></div>
    </div>
  `;
};
function switchPomoMode(mode) { pomoMode = mode; resetPomo(); Nav.refresh(); }
window.setPomoTask = function(v) { pomoTaskId = v || null; };
function togglePomo() {
  pomoRunning = !pomoRunning;
  const targetSec = POMO_PRESETS.find(p => p.mode === pomoMode).minutes * 60;
  if (pomoRunning) {
    pomoTimer = setInterval(() => {
      pomoSeconds++;
      if (pomoSeconds >= targetSec) { pomoRunning = false; clearInterval(pomoTimer); pomoTimer = null; completePomo(); return; }
      const el = $('.pomo-display'); if (el) el.textContent = `${String(Math.floor((targetSec - pomoSeconds)/60)).padStart(2,'0')}:${String((targetSec - pomoSeconds) % 60).padStart(2,'0')}`;
      const circle = $('.pomo-ring circle:last-child'); if (circle) circle.setAttribute('stroke-dashoffset', 565.5 * (1 - pomoSeconds / targetSec));
    }, 1000);
    $('#pomoBtn').innerHTML = ICO.pause + ' 暂停';
  } else {
    clearInterval(pomoTimer); pomoTimer = null;
    $('#pomoBtn').innerHTML = ICO.play + ' 继续';
  }
  Nav.refresh();
}
function resetPomo() { pomoRunning = false; pomoSeconds = 0; if (pomoTimer) { clearInterval(pomoTimer); pomoTimer = null; } Nav.refresh(); }
function completePomo() {
  pomoRunning = false; if (pomoTimer) { clearInterval(pomoTimer); pomoTimer = null; }
  const minutes = POMO_PRESETS.find(p => p.mode === pomoMode).minutes;
  const today = Store.getDaily('pomo', { count: 0, sessions: [] });
  today.count = (today.count || 0) + 1;
  if (!today.sessions) today.sessions = [];
  const taskText = pomoTaskId ? (getPlan(todayKey()).find(t => t.id === pomoTaskId)?.text || '') : '';
  today.sessions.push({ mode: pomoMode, minutes, time: nowTime(), task: taskText });
  Store.setDaily('pomo', today);
  if (pomoMode === 'focus') {
    Game.data.pomodoros = (Game.data.pomodoros || 0) + 1;
    Game.save();
    Game.reward(minutes * 2, minutes, 2, 'discipline');
    if (pomoTaskId) { completeTaskById(pomoTaskId); pomoTaskId = null; }
    toast(`番茄完成！专注 ${minutes} 分钟`, 'success');
  } else {
    toast(`休息结束，继续加油！`, 'success');
  }
  pomoSeconds = 0;
  Nav.refresh();
}

// ---------- 奖励商店 (LifeUp 风格 Shop) ----------
const DEFAULT_SHOP_ITEMS = [
  { id: 'default_1', name: '看一部电影', icon: '🎬', cost: 50, desc: '奖励自己看一部喜欢的电影', active: true },
  { id: 'default_2', name: '吃一顿大餐', icon: '🍔', cost: 100, desc: '去吃一顿心心念念的美食', active: true },
  { id: 'default_3', name: '休息30分钟', icon: '😴', cost: 30, desc: '什么都不做，好好休息', active: true },
  { id: 'default_4', name: '玩1小时游戏', icon: '🎮', cost: 80, desc: '痛痛快快玩一小时', active: true },
  { id: 'default_5', name: '买一件小礼物', icon: '🎁', cost: 200, desc: '给自己买一件小礼物', active: true },
  { id: 'default_6', name: '刷手机30分钟', icon: '📱', cost: 20, desc: '放心刷手机，不内疚', active: true },
];
const SHOP_ICONS = ['🎬','🍔','😴','🎮','🎁','📱','☕','🎵','📺','🍰','🛍️','🚶','🏊','🎨','📚','💰','⭐','🏆'];
Modules.shop = () => {
  const items = Store.get('wb_shop', DEFAULT_SHOP_ITEMS);
  const activeItems = items.filter(i => i.active !== false);
  const purchases = Game.data.shopPurchases || [];
  const d = Game.data;
  return `
    <div class="card weread-banner" style="background:linear-gradient(135deg,#fef3c7,#fde68a);">
      <div class="weread-logo" style="background:linear-gradient(135deg,#f59e0b,#d97706);">${ICONS.coin}</div>
      <div class="weread-info"><div class="weread-title" style="color:#92400e;">我的金币: ${d.coins}</div><div class="weread-desc" style="color:#78350f;">完成任务赚取金币，在商店兑换奖励</div></div>
    </div>
    <div class="card"><div class="card-title">🛒 添加奖励商品</div>
      <div class="form-row-3">
        <div class="form-group"><label class="field-label">奖励名称</label><input type="text" id="shopName" placeholder="如：看一集番剧"></div>
        <div class="form-group"><label class="field-label">金币价格</label><input type="number" id="shopCost" placeholder="50" min="1"></div>
        <div class="form-group"><label class="field-label">图标</label><select id="shopIcon">${SHOP_ICONS.map(i=>`<option value="${i}">${i}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label class="field-label">描述（可选）</label><input type="text" id="shopDesc" placeholder="奖励说明"></div>
      <button class="btn btn-primary" onclick="addShopItem()">添加商品</button>
    </div>
    <div class="card"><div class="card-title">🛍️ 奖励商店 (${activeItems.length})</div>
      <div class="shop-grid">${activeItems.map(item => {
        const canAfford = d.coins >= item.cost;
        return `<div class="shop-card ${!canAfford?'disabled':''}">
          <div class="shop-icon">${item.icon}</div>
          <div class="shop-info"><div class="shop-name">${esc(item.name)}</div>${item.desc?`<div class="shop-desc">${esc(item.desc)}</div>`:''}</div>
          <div class="shop-price">${ICONS.coin} ${item.cost}</div>
          <div class="shop-actions">
            <button class="btn ${canAfford?'btn-primary':'btn-outline'} btn-sm" ${!canAfford?'disabled':''} onclick="buyShopItem('${item.id}')">兑换</button>
            <button class="btn-icon" onclick="editShopItem('${item.id}')">${ICO.edit}</button>
            <button class="btn-icon danger" onclick="confirmDelShopItem('${item.id}')">${ICO.trash}</button>
          </div>
        </div>`;
      }).join('')}</div>
    </div>
    <div class="card"><div class="card-title">📜 兑换记录 (${purchases.length})</div>${purchases.length ? purchases.slice().reverse().slice(0, 20).map(p => `<div class="task-item-v2"><span style="font-size:18px;">${p.icon}</span><span class="task-text">${esc(p.name)}</span><span class="tag tag-orange">-🪙${p.cost}</span><span class="text-muted text-sm">${esc(p.date)}</span></div>`).join('') : '<div class="empty-state-v2"><div class="empty-state-v2-icon">📜</div><div class="empty-state-v2-text">还没有兑换记录</div></div>'}</div>
  `;
};
function addShopItem() {
  const name = $('#shopName').value.trim(), cost = parseInt($('#shopCost').value) || 0, icon = $('#shopIcon').value, desc = $('#shopDesc').value.trim();
  if (!name) return toast('请输入奖励名称', 'warning');
  if (cost < 1) return toast('请输入有效的金币价格', 'warning');
  const items = Store.get('wb_shop', DEFAULT_SHOP_ITEMS);
  items.push({ id: uid(), name, cost, icon, desc, active: true });
  Store.set('wb_shop', items);
  toast('商品已添加 🛍️', 'success'); Nav.refresh();
}
function buyShopItem(id) {
  const items = Store.get('wb_shop', DEFAULT_SHOP_ITEMS);
  const item = items.find(i => i.id === id); if (!item) return;
  if (Game.data.coins < item.cost) return toast('金币不足，继续努力！', 'warning');
  Game.data.coins -= item.cost;
  if (!Game.data.shopPurchases) Game.data.shopPurchases = [];
  Game.data.shopPurchases.push({ id: uid(), name: item.name, icon: item.icon, cost: item.cost, date: nowDateTime() });
  Game.save();
  Game.renderSidebar();
  toast(`🎉 兑换成功！享受你的奖励: ${item.name}`, 'success');
  Nav.refresh();
}
function editShopItem(id) {
  const items = Store.get('wb_shop', DEFAULT_SHOP_ITEMS); const item = items.find(i => i.id === id); if (!item) return;
  UI.editModal({ title: '编辑商品', icon: '🛍️', fields: [{ key: 'name', label: '奖励名称', type: 'text' }, { key: 'cost', label: '金币价格', type: 'number', min: 1 }, { key: 'icon', label: '图标', type: 'select', options: SHOP_ICONS.map(i=>({value:i,label:i})) }, { key: 'desc', label: '描述', type: 'text' }], values: item,
    onSave: (v) => { Object.assign(item, v); item.cost = parseInt(item.cost) || 1; Store.set('wb_shop', items); toast('商品已更新', 'success'); Nav.refresh(); },
    onDelete: () => { UI.confirm(`确定删除「${item.name}」吗？`, () => { Store.set('wb_shop', items.filter(i => i.id !== id)); Nav.refresh(); }); } });
}
function confirmDelShopItem(id) { const items = Store.get('wb_shop', DEFAULT_SHOP_ITEMS); const item = items.find(i => i.id === id); if (!item) return; UI.confirm(`确定删除「${item.name}」吗？`, () => { Store.set('wb_shop', items.filter(i => i.id !== id)); Nav.refresh(); }); }

// ---------- 成就墙 ----------
const ALL_ACHIEVEMENTS = [
  { id: 'first_checkin', name: '初心者', desc: '完成第一次打卡', icon: '📍', cat: '打卡' },
  { id: 'week_streak', name: '一周坚持', desc: '累计打卡 7 天', icon: '🔥', cat: '打卡' },
  { id: 'month_streak', name: '月度达人', desc: '累计打卡 30 天', icon: '📅', cat: '打卡' },
  { id: 'centurion', name: '百日传奇', desc: '累计打卡 100 天', icon: '💯', cat: '打卡' },
  { id: 'task_10', name: '初出茅庐', desc: '完成 10 个任务', icon: '📋', cat: '任务' },
  { id: 'task_50', name: '任务达人', desc: '完成 50 个任务', icon: '⚡', cat: '任务' },
  { id: 'task_200', name: '任务终结者', desc: '完成 200 个任务', icon: '🏆', cat: '任务' },
  { id: 'lv5', name: '小有所成', desc: '等级达到 5 级', icon: '⭐', cat: '等级' },
  { id: 'lv10', name: '渐入佳境', desc: '等级达到 10 级', icon: '🌟', cat: '等级' },
  { id: 'lv20', name: '大师之路', desc: '等级达到 20 级', icon: '👑', cat: '等级' },
  { id: 'rich_500', name: '小富翁', desc: '累计获得 500 金币', icon: '💰', cat: '财富' },
  { id: 'rich_2000', name: '财大气粗', desc: '累计获得 2000 金币', icon: '💎', cat: '财富' },
  { id: 'first_pomo', name: '番茄新手', desc: '完成第一个番茄钟', icon: '🍅', cat: '专注' },
  { id: 'pomo_25', name: '番茄大师', desc: '完成 25 个番茄钟', icon: '🥇', cat: '专注' },
  { id: 'attr_strength_5', name: '体力达人', desc: '体力达到 5 级', icon: '💪', cat: '属性' },
  { id: 'attr_intelligence_5', name: '智力达人', desc: '智力达到 5 级', icon: '🧠', cat: '属性' },
  { id: 'attr_charisma_5', name: '魅力达人', desc: '魅力达到 5 级', icon: '✨', cat: '属性' },
  { id: 'attr_creativity_5', name: '创造力达人', desc: '创造力达到 5 级', icon: '🎨', cat: '属性' },
  { id: 'attr_discipline_5', name: '自律达人', desc: '自律达到 5 级', icon: '🎯', cat: '属性' },
  { id: 'attr_strength_10', name: '体力大师', desc: '体力达到 10 级', icon: '💪', cat: '属性' },
  { id: 'attr_intelligence_10', name: '智力大师', desc: '智力达到 10 级', icon: '🧠', cat: '属性' },
  { id: 'read_100', name: '百页读者', desc: '累计阅读 100 页', icon: '📖', cat: '阅读' },
  { id: 'read_1000', name: '千页书虫', desc: '累计阅读 1000 页', icon: '📚', cat: '阅读' },
  { id: 'ex_10', name: '运动新手', desc: '完成 10 次锻炼', icon: '💪', cat: '运动' },
  { id: 'ex_50', name: '运动达人', desc: '完成 50 次锻炼', icon: '🏃', cat: '运动' },
];
Modules.achieve = () => {
  const unlocked = Game.data.achievements || [];
  const unlockedIds = unlocked.map(a => a.id);
  const cats = [...new Set(ALL_ACHIEVEMENTS.map(a => a.cat))];
  const d = Game.data;
  return `
    <div class="compact-stats">
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--warning);">${unlocked.length}</div><div class="compact-stat-label">${ICONS.medal} 已解锁</div></div>
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--text-light);">${ALL_ACHIEVEMENTS.length}</div><div class="compact-stat-label">${ICONS.list} 总成就</div></div>
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--primary);">${(unlocked.length / ALL_ACHIEVEMENTS.length * 100).toFixed(0)}%</div><div class="compact-stat-label">${ICONS.chart} 完成率</div></div>
      <div class="compact-stat"><div class="compact-stat-num" style="color:var(--danger);">Lv.${d.level}</div><div class="compact-stat-label">${ICONS.star} 当前等级</div></div>
    </div>
    ${cats.map(cat => {
      const catAch = ALL_ACHIEVEMENTS.filter(a => a.cat === cat);
      const catUnlocked = catAch.filter(a => unlockedIds.includes(a.id));
      return `<div class="card"><div class="card-title">${catAch[0].icon.split(' ')[0]} ${cat} <span class="card-subtitle">${catUnlocked.length}/${catAch.length}</span></div>
        <div class="achieve-grid">${catAch.map(a => {
          const isUnlocked = unlockedIds.includes(a.id);
          const unlockInfo = unlocked.find(u => u.id === a.id);
          return `<div class="achieve-card ${isUnlocked?'unlocked':'locked'}">
            <div class="achieve-icon ${isUnlocked?'':'locked'}">${a.icon}</div>
            <div class="achieve-info"><div class="achieve-name">${a.name}</div><div class="achieve-desc">${a.desc}</div>${isUnlocked && unlockInfo?.date ? `<div class="achieve-date">${ICONS.calendar} ${unlockInfo.date}</div>` : ''}</div>
            ${isUnlocked ? '<div class="achieve-badge">'+ICONS.check+'</div>' : '<div class="achieve-badge">'+ICONS.lock+'</div>'}
          </div>`;
        }).join('')}</div>
      </div>`;
    }).join('')}
  `;
};

// ===== 数据备份模块 (云迁移 / 换设备) =====
function collectBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('wb_')) {
      try { data[k] = JSON.parse(localStorage.getItem(k)); } catch { data[k] = localStorage.getItem(k); }
    }
  }
  return data;
}
function exportBackup() {
  const data = collectBackup();
  const payload = { app: 'personal-workbench', version: 2, exportedAt: new Date().toISOString(), count: Object.keys(data).length, data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workbench-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast(`已导出 ${payload.count} 项数据`, 'success');
}
function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const data = payload.data || payload;
      if (!data || typeof data !== 'object') throw new Error('文件格式不正确');
      UI.confirm(`导入将覆盖当前所有本地数据（共 ${Object.keys(data).length} 项），确定继续吗？`, () => {
        let n = 0;
        for (const k in data) { if (k.startsWith('wb_')) { localStorage.setItem(k, JSON.stringify(data[k])); n++; } }
        if (window.wbSync && window.wbSync.enabled) window.wbSync.pushAll();
        toast(`已导入 ${n} 项数据，即将刷新页面...`, 'success');
        setTimeout(() => location.reload(), 1500);
      });
    } catch (e) { toast('导入失败：' + e.message, 'error'); }
  };
  reader.readAsText(file);
}
function clearAllData() {
  UI.confirm('⚠️ 将清空所有本地数据且不可恢复，确定吗？', () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('wb_')) keys.push(k); }
    keys.forEach(k => localStorage.removeItem(k));
    toast('已清空全部数据', 'warning');
    setTimeout(() => location.reload(), 600);
  });
}
Modules.backup = () => {
  const data = collectBackup();
  const keys = Object.keys(data);
  const sizeKB = (JSON.stringify(data).length / 1024).toFixed(1);
  return `
    <div class="card">
      <div class="card-title">${ICONS.cloud} 云端同步状态</div>
      <div class="card-subtitle">所有 <b>wb_</b> 开头的本地数据会自动同步到服务器（同源 <code>/api/sync</code>），手机与电脑实时同步。首次在新设备打开时，数据会自动从服务器合并下来。</div>
      <div class="backup-stat">
        <span id="syncStatusText">检测中...</span>
        <span id="syncItemCount"></span>
      </div>
      <div id="syncErrorDetail" class="sync-error-detail" style="display:none;"></div>
      <div class="backup-actions">
        <button class="btn btn-primary" onclick="manualSync()" id="btnManualSync">${ICO.refresh} 立即同步</button>
        <button class="btn btn-outline" onclick="forcePullAll()">${ICO.download} 从云端拉取</button>
      </div>
      <div class="backup-tip" id="syncTip">${ICONS.bulb} 首次使用多设备同步？先在旧设备打开一次工作台（会自动推送数据），然后在新设备打开即可看到同步的数据。右下角的同步状态图标可实时查看连接状态。</div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-title">${ICONS.archive} 数据备份与迁移</div>
      <div class="card-subtitle">工作台的所有数据都保存在本浏览器本地（localStorage）。换设备、部署到云服务器后，用下方功能把数据带走。</div>
      <div class="backup-stat"><span>当前数据项：<b>${keys.length}</b></span><span>约占用：<b>${sizeKB} KB</b></span></div>
      <div class="backup-actions">
        <button class="btn btn-primary" onclick="exportBackup()">${ICO.download} 导出备份 (JSON)</button>
        <label class="btn btn-outline">⬆️ 导入备份<input type="file" id="backupFile" accept="application/json,.json" hidden></label>
        <button class="btn btn-danger-outline" onclick="clearAllData()">🗑️ 清空全部数据</button>
      </div>
      <div class="backup-tip">${ICONS.bulb} 提示：部署到云或换手机后，先在此「导出备份」，再到新环境的「数据备份」页「导入备份」，即可完整迁移（含微信读书 Cookie、游戏进度等）。</div>
    </div>`;
};
ModuleHooks.backup = () => {
  const inp = $('#backupFile');
  if (inp) inp.addEventListener('change', e => { importBackup(e.target.files[0]); e.target.value = ''; });
  updateSyncStatusUI();
  // 每 3 秒刷新同步状态
  const syncUIInterval = setInterval(() => {
    const el = $('#syncStatusText');
    if (!el) { clearInterval(syncUIInterval); return; }
    updateSyncStatusUI();
  }, 3000);
};

Modules.settings = () => {
  const p = UserProfile.get();
  const EMOJI_CHOICES = ['🦊','🐱','🐰','🦁','🐼','🐯','🚀','🌟','🔥','🌈','🍀','⚡'];
  return `
    <div class="card">
      <div class="card-title">⚙️ 个人设置</div>
      <div class="card-subtitle">自由定制你的工作台形象（纯个人偏好，无解锁门禁）。</div>
      <div class="form-row" style="margin-top:12px;">
        <div class="form-group">
          <label class="form-label">显示昵称</label>
          <input type="text" id="settingUserName" class="form-input" value="${esc(p.name || '我')}" maxlength="12" placeholder="例如：小明">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">头衔 / 签名（显示在头像旁）</label>
          <input type="text" id="settingUserTitle" class="form-input" value="${esc(p.title || '')}" maxlength="16" placeholder="例如：元气打工人">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">头像缩写（留空自动生成）</label>
          <input type="text" id="settingUserAvatar" class="form-input" value="${esc(p.avatar || '')}" maxlength="4" placeholder="例如：XM">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Emoji 头像（优先于缩写）</label>
          <input type="text" id="settingUserEmoji" class="form-input" value="${esc(p.avatarEmoji || '')}" maxlength="2" placeholder="例如：🦊">
          <div class="emoji-quick">${EMOJI_CHOICES.map(e => `<span class="emoji-quick-item" onclick="document.getElementById('settingUserEmoji').value='${e}'">${e}</span>`).join('')}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">主题色</label>
          <div class="accent-chips">
            ${Object.entries(ACCENT_PRESETS).map(([k, v]) => `<span class="accent-chip ${p.accent === k ? 'active' : ''}" data-accent="${k}" style="background:${v.primary}" onclick="selectAccent('${k}')" title="${v.name}"></span>`).join('')}
          </div>
          <input type="hidden" id="settingAccent" value="${esc(p.accent || 'sky')}">
        </div>
      </div>
      <div class="backup-actions" style="margin-top:14px;">
        <button class="btn btn-primary" onclick="saveUserProfile()">${ICONS.archive} 保存设置</button>
      </div>
      <div class="backup-tip">修改后会立即生效，并随数据备份一起保存。</div>
    </div>`;
};
ModuleHooks.settings = () => {};
window.selectAccent = function(k) {
  document.getElementById('settingAccent').value = k;
  document.querySelectorAll('.accent-chip').forEach(c => c.classList.toggle('active', c.dataset.accent === k));
};
window.saveUserProfile = function() {
  const name = ($('#settingUserName').value || '').trim();
  const avatar = ($('#settingUserAvatar').value || '').trim();
  const title = ($('#settingUserTitle').value || '').trim();
  const avatarEmoji = ($('#settingUserEmoji').value || '').trim();
  const accent = ($('#settingAccent').value || 'sky').trim();
  if (!name) { toast('请输入昵称', 'error'); return; }
  UserProfile.set({ name, avatar, title, avatarEmoji, accent });
  applyPersonalization(); // 立即应用主题色 / 头像
  // 立即刷新 Header 头像/问候和首页问候
  const avatarEl = $('#headerAvatar');
  if (avatarEl) { avatarEl.textContent = UserProfile.get().avatarEmoji || UserProfile.initials; avatarEl.title = UserProfile.displayName + (title ? (' · ' + title) : ''); }
  const greet = $('#headerGreeting');
  if (greet) {
    const now = new Date();
    const hr = now.getHours();
    const g = hr < 6 ? '凌晨好' : hr < 12 ? '早上好' : hr < 14 ? '中午好' : hr < 18 ? '下午好' : hr < 22 ? '晚上好' : '夜深了';
    greet.textContent = `${g}，${UserProfile.displayName}`;
  }
  const dashGreet = $('#dashHeroGreet');
  if (dashGreet) dashGreet.textContent = `${g}，${UserProfile.displayName} 今天也要元气满满`;
  toast('个人设置已保存', 'success');
};

// 云端同步辅助函数
function updateSyncStatusUI() {
  var el = $('#syncStatusText');
  var elCount = $('#syncItemCount');
  if (!el) return;
  try {
    var badge = document.getElementById('wbSyncBadge');
    var status = badge ? badge.className : '';
    var txt = badge && badge.querySelector('.txt') ? badge.querySelector('.txt').textContent : '未检测到';
    el.textContent = '📡 状态：' + txt;
    if (status.indexOf('ok') >= 0) el.style.color = '#10b981';
    else if (status.indexOf('error') >= 0) el.style.color = '#ef4444';
    else if (status.indexOf('local') >= 0) el.style.color = '#64748b';
    else if (status.indexOf('syncing') >= 0 || status.indexOf('connecting') >= 0) el.style.color = '#f59e0b';
    // 统计云端可同步的数据项数量
    var count = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.charAt(0) === 'w' && k.charAt(1) === 'b' && k.charAt(2) === '_' && k !== '_wb_sync_meta') count++;
    }
    if (elCount) elCount.textContent = '本地可同步项：' + count;
    var errEl = document.getElementById('syncErrorDetail');
    if (errEl) {
      if (window.wbSync && window.wbSync.lastError) {
        errEl.textContent = '⚠️ 错误详情：' + window.wbSync.lastError;
        errEl.style.display = 'block';
      } else {
        errEl.style.display = 'none';
      }
    }
  } catch(e) {}
}
window.manualSync = function() {
  if (window.wbSync && window.wbSync.enabled) {
    window.wbSync.pushAll();
    toast('正在同步数据到云端...', 'success');
    // 延迟刷新状态
    setTimeout(updateSyncStatusUI, 1500);
  } else {
    toast('⚠️ 云端同步未就绪，请检查网络连接', 'error');
  }
};
window.forcePullAll = function() {
  if (window.wbSync && window.wbSync.enabled) {
    // 触发重新拉取（底层 sync.js 有 pullRetryCount 控制，这里直接刷新页面最快）
    location.reload();
  } else {
    toast('⚠️ 云端同步未就绪，请检查网络连接', 'error');
  }
};

// ===== 移动端滑动手势 =====
function initSwipeGesture() {
  if (window.innerWidth > 768) return; // 仅移动端
  var touchStartX = 0, touchStartY = 0, touchMoved = false;
  var content = $('#content');
  if (!content) return;
  content.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
  }, { passive: true });
  content.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    touchMoved = true;
  }, { passive: true });
  content.addEventListener('touchend', function(e) {
    if (!touchMoved) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    // 忽略垂直滑动和过小的水平滑动
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 60) return;
    // 构建模块顺序
    var mobileOrder = MENU.map(function(m) { return m.id; });
    var idx = mobileOrder.indexOf(Nav.current);
    if (dx > 0 && idx > 0) Nav.switchTo(mobileOrder[idx - 1]); // 右滑回上一个
    else if (dx < 0 && idx < mobileOrder.length - 1) Nav.switchTo(mobileOrder[idx + 1]); // 左滑到下一个
  });
  // 窗口大小变化时重新判断
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) initSwipeGesture();
  });
}

function initSidebarSwipe() {
  if (window.innerWidth > 768) return;
  const EDGE = 28; // 左边缘触发打开抽屉的距离
  let sx = 0, sy = 0, startedInside = false;
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    startedInside = $('#sidebar')?.contains(e.touches[0].target) || false;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 50) return;
    const sb = $('#sidebar');
    const isOpen = sb && sb.classList.contains('open');
    // 侧栏已打开：在侧栏内向左滑关闭
    if (isOpen && startedInside && dx < 0) { Sidebar.close(); return; }
    // 侧栏关闭：从左边缘向右滑打开
    if (!isOpen && !startedInside && sx <= EDGE && dx > 0) Sidebar.open();
  }, { passive: true });
}

// ===== 首页个性化（纯个人偏好，无解锁/奖励） =====
const RING_META = {
  task: { name: '今日计划', icon: ICONS.list },
  water: { name: '好好喝水', icon: ICONS.water },
  exercise: { name: '锻炼身体', icon: ICONS.run },
  read: { name: '每日阅读', icon: ICONS.book },
};
const SECTION_META = { overview: { name: '今日计划概览' }, streak: { name: '最近 7 天打卡' }, quote: { name: '每日金句' } };

function renderFirstRunHint() {
  const content = $('#content'); if (!content) return;
  if (Store.get('wb_onboarded', false)) {
    const old = document.getElementById('firstRunHint'); if (old) old.remove();
    return;
  }
  const hint = document.createElement('div');
  hint.className = 'first-run-hint';
  hint.id = 'firstRunHint';
  hint.innerHTML = `<span class="frh-icon">👋</span><div class="frh-body">欢迎使用你的个人工作台！右下角 <b>+</b> 可一键记录日常（任务 / 喝水 / 阅读 / 番茄）；点 <b>+</b> 里的「自定义首页」能隐藏不常用的卡片、调整圆环顺序。祝你元气满满～</div><button class="frh-close" onclick="dismissFirstRunHint()">知道了</button>`;
  content.insertBefore(hint, content.firstChild);
}
window.dismissFirstRunHint = function() {
  Store.set('wb_onboarded', true);
  const el = document.getElementById('firstRunHint'); if (el) el.remove();
};

// ---------- 全局快捷添加 FAB（降低记录摩擦，无奖励门禁） ----------
function initQuickFab() {
  if (document.getElementById('quickFab')) return;
  const fab = document.createElement('div');
  fab.className = 'quick-fab'; fab.id = 'quickFab';
  fab.setAttribute('role', 'button'); fab.setAttribute('aria-label', '快捷添加');
  fab.innerHTML = ICONS.plus;
  fab.onclick = toggleFab;
  const sheet = document.createElement('div');
  sheet.className = 'fab-sheet'; sheet.id = 'fabSheet';
  sheet.innerHTML = `
    <button class="fab-action" onclick="fabAddTask()"><span>${ICONS.list}</span>添加任务</button>
    <button class="fab-action" onclick="fabAddWater()"><span>${ICONS.water}</span>喝一杯水</button>
    <button class="fab-action" onclick="fabAddReading()"><span>${ICONS.book}</span>记阅读 +5 页</button>
    <button class="fab-action" onclick="fabStartPomo()"><span>${ICONS.tomato}</span>开始番茄</button>
    <button class="fab-action" onclick="openHomeCustomize()"><span>${ICONS.settings}</span>自定义首页</button>`;
  document.body.appendChild(fab);
  document.body.appendChild(sheet);
  document.addEventListener('click', (e) => {
    const s = document.getElementById('fabSheet');
    if (!s || !s.classList.contains('open')) return;
    if (e.target.closest('#quickFab') || e.target.closest('#fabSheet')) return;
    closeFab();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { Sidebar.close(); closeFab(); if (window._customizeOverlay) closeCustomize(); }
  });
}
function toggleFab() {
  const s = document.getElementById('fabSheet'); const f = document.getElementById('quickFab');
  if (!s) return;
  const open = s.classList.toggle('open');
  f?.classList.toggle('active', open);
}
function closeFab() {
  document.getElementById('fabSheet')?.classList.remove('open');
  document.getElementById('quickFab')?.classList.remove('active');
}
window.fabAddTask = function() { closeFab(); Nav.switchTo('plan'); setTimeout(() => document.getElementById('taskInput')?.focus(), 350); };
window.fabAddWater = function() { addWater(1); if (Nav.current === 'home') Nav.refresh(); else toast('💧 +1 杯水', 'success'); closeFab(); };
window.fabAddReading = function() { quickAddReading(5); closeFab(); };
window.fabStartPomo = function() { closeFab(); Nav.switchTo('pomo'); if (typeof pomoRunning !== 'undefined' && !pomoRunning) togglePomo(); };
window.quickAddReading = function(delta) {
  const today = Store.getDaily('reading', { pages: 0, minutes: 0, notes: '' });
  today.pages = (today.pages || 0) + delta;
  Store.setDaily('reading', today);
  const history = Store.get('wb_reading_history', []); const td = todayKey();
  const idx = history.findIndex(h => h.date === td);
  if (idx >= 0) history[idx] = { date: td, pages: today.pages, minutes: today.minutes || 0, notes: today.notes || '' };
  else history.push({ date: td, pages: today.pages, minutes: today.minutes || 0, notes: '' });
  Store.set('wb_reading_history', history);
  Game.reward(Math.floor(delta / 10), Math.floor(delta / 5), 1, 'intelligence');
  Game.data.totalReadPages = (Game.data.totalReadPages || 0) + delta; Game.save();
  toast(`📖 +${delta} 页`, 'success');
  if (Nav.current === 'home') Nav.refresh();
};
window.quickWater = function() { addWater(1); if (Nav.current === 'home') Nav.refresh(); else toast('💧 +1 杯水', 'success'); };
window.quickReading = function() { quickAddReading(5); if (Nav.current !== 'home') toast('📖 +5 页', 'success'); };
window.quickExercise = function() { quickAddExercise(10); if (Nav.current !== 'home') toast('💪 +10 分钟运动', 'success'); };
window.quickAddExercise = function(min) {
  const today = Store.getDaily('exercise', { medMinutes: 0, workouts: [] });
  today.workouts.push({ id: uid(), type: '快速运动', icon: '⚡', minutes: min, note: '' });
  Store.setDaily('exercise', today);
  Game.reward(10, 5, 3, 'strength');
  Game.data.totalWorkouts = (Game.data.totalWorkouts || 0) + 1; Game.save();
  toast(`💪 +${min} 分钟运动`, 'success');
  if (Nav.current === 'home') Nav.refresh();
};

// ---------- 首页自定义弹窗 ----------
let _customizeRings = [];
let _customizeHidden = [];
window.openHomeCustomize = function() {
  if (window._customizeOverlay) { window._customizeOverlay.remove(); window._customizeOverlay = null; }
  const lay = HomeLayout.get();
  _customizeRings = lay.rings.slice();
  _customizeHidden = lay.hiddenRings.slice();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal customize-modal">
    <div class="modal-header"><div class="modal-title">${ICONS.settings} 自定义首页</div><button class="modal-close" onclick="closeCustomize()">${ICONS.close}</button></div>
    <div class="modal-body">
      <div class="customize-sub">圆环顺序与显示（用 ↑ ↓ 调整顺序，关闭即隐藏）</div>
      <div id="ringList"></div>
      <div class="customize-sub">板块显示</div>
      <div class="customize-sections">${Object.keys(SECTION_META).map(k => `<label class="switch-row"><span>${SECTION_META[k].name}</span><label class="switch"><input type="checkbox" data-sec="${k}" ${lay.sections[k] ? 'checked' : ''}><span class="switch-slider"></span></label></label>`).join('')}</div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="HomeLayout.reset(); openHomeCustomize();">恢复默认</button><button class="btn btn-primary" onclick="saveHomeCustomize()">完成</button></div>
  </div>`;
  document.body.appendChild(overlay);
  window._customizeOverlay = overlay;
  renderRingList();
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomize(); });
};
function renderRingList() {
  const list = document.getElementById('ringList'); if (!list) return;
  list.innerHTML = _customizeRings.map((k, i) => `<div class="reorder-item">
    <span class="reorder-handle">${ICONS.list}</span>
    <span class="reorder-name">${RING_META[k].icon} ${RING_META[k].name}</span>
    <label class="switch"><input type="checkbox" data-ring="${k}" ${_customizeHidden.includes(k) ? '' : 'checked'}><span class="switch-slider"></span></label>
    <span class="reorder-btns"><button type="button" onclick="moveRing(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" onclick="moveRing(${i},1)" ${i === _customizeRings.length - 1 ? 'disabled' : ''}>↓</button></span>
  </div>`).join('');
}
window.moveRing = function(i, dir) {
  const j = i + dir; if (j < 0 || j >= _customizeRings.length) return;
  const t = _customizeRings[i]; _customizeRings[i] = _customizeRings[j]; _customizeRings[j] = t;
  renderRingList();
};
window.closeCustomize = function() { const o = window._customizeOverlay; if (o) { o.remove(); window._customizeOverlay = null; } };
window.saveHomeCustomize = function() {
  const overlay = window._customizeOverlay; if (!overlay) return;
  const hidden = [];
  overlay.querySelectorAll('input[data-ring]').forEach(cb => { if (!cb.checked) hidden.push(cb.dataset.ring); });
  const sections = {};
  overlay.querySelectorAll('input[data-sec]').forEach(cb => { sections[cb.dataset.sec] = cb.checked; });
  HomeLayout.set({ rings: _customizeRings.slice(), hiddenRings: hidden, sections });
  closeCustomize();
  if (Nav.current === 'home') Nav.switchTo('home'); else Nav.refresh();
  toast('首页已更新', 'success');
};

// ===== 初始化 =====
function init() {
  Theme.init();
  applyPersonalization(); // 应用个人主题色 / 头像（必须在渲染前覆盖 CSS 变量）
  attachRipple();
  Game.init();
  Nav.init();
  // 移动端左右滑动手势切换模块
  initSwipeGesture();
  // 侧栏滑动手势：左边缘右滑打开，侧栏内左滑关闭
  initSidebarSwipe();
  // 云端实时同步：远端变更到达时重渲染当前视图（输入框聚焦时不打断）
  window.addEventListener('wb:remote', () => {
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return;
    Game.init(); // 刷新游戏数据
    if (typeof Nav !== 'undefined' && Nav.refresh) Nav.refresh();
  });
  Game.renderSidebar();
  Clock.start();
  initQuickFab();
  Nav.switchTo('home');
  // 初始化后推本地数据上云（延迟执行，等 sync.js 就绪）
  setTimeout(() => {
    if (window.wbSync && window.wbSync.enabled) {
      window.wbSync.pushAll();
    }
  }, 2000);
  // 定期自动推送（每30秒检查一次，防止定时器遗漏）
  setInterval(() => {
    if (window.wbSync && window.wbSync.enabled) {
      window.wbSync.pushAll();
    }
  }, 30000);
  if (Game.data.totalCheckIns === 0 && !Game.hasCheckedInToday()) {
    setTimeout(() => toast('欢迎来到个人工作台！记得每天打卡哦', 'success'), 500);
  }
  // 注册 Service Worker (PWA 离线 / 全屏)
  // 仅在 localhost 或 https 下注册：局域网 HTTP 非安全上下文不支持 SW，静默跳过即可
  if ('serviceWorker' in navigator && (location.hostname === 'localhost' || location.protocol === 'https:')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // 新 Service Worker 接管页面后自动刷新，确保手机端一定拿到最新代码
        // （根治 iOS PWA 从后台唤起不重载、一直跑旧版的问题）
        let wbReloading = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (wbReloading) return;
          wbReloading = true;
          location.reload();
        });
        // 兜底：检测到新版本且旧 SW 仍在运行时，显示可点击的刷新提示条
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showSWUpdateBar();
          });
        });
      }).catch(() => {});
    });
  }
  // 移动端首次滑动提示
  if (window.innerWidth <= 768 && !localStorage.getItem('wb_swipe_hint_shown')) {
    var hint = document.createElement('div');
    hint.className = 'swipe-hint';
    hint.textContent = '👈 左右滑动切换模块 👉';
    document.body.appendChild(hint);
    setTimeout(function() { if (hint.parentNode) hint.remove(); }, 3500);
    localStorage.setItem('wb_swipe_hint_shown', '1');
  }
}

init();
