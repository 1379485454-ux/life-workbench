// 微信云开发环境 ID：在你自己的小程序后台开通「云开发」后，把环境 ID 填到下面一行。
// 开通步骤：微信开发者工具 → 点顶部「云开发」→ 开通 → 复制环境 ID 粘贴到此处。
const CLOUD_ENV = 'cloud1-d5gxys2xta2350700';

App({
  globalData: {
    userId: 'edys-workbench'
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库不支持云开发，请使用 2.2.3 以上的基础库');
      return;
    }
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true
    });
  }
});
