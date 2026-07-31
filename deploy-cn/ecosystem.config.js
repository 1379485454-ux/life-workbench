// ============================================================
//  个人工作台 · PM2 进程守护配置
//  作用：node server.js 进程意外退出时自动重启，保证 7×24 在线
//  使用：pm2 start deploy-cn/ecosystem.config.js
// ============================================================
module.exports = {
  apps: [
    {
      name: 'life-workbench',
      script: 'server.js',
      cwd: '/opt/life-workbench',        // ← 改成你实际 clone 的目录
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,                       // Nginx 反代到这里
        // WB_OFFLINE: '1',               // 如需强制走内置示例数据（断网兜底）可取消注释
      },
    },
  ],
};
