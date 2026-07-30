# 个人工作台 · 部署指南（电脑关机也能访问）

本工作台是纯前端 + Node 代理服务器。默认所有数据存在**浏览器本地（localStorage）**，
应用跑在你电脑上。要让它「电脑关机也能访问」，需把应用部署到一个 **7×24 在线的服务器**。

本项目已改造为**云就绪**（服务器读取 `PORT` 环境变量、无需自签证书即可以单端口 HTTP 运行）。

---

## 一、本地运行（你已经在用）
```bash
cd workbench
node server.js
# 打开 http://localhost:8080
```
- 局域网手机访问：`http://<你电脑局域网IP>:8080`
- 真·PWA（iPhone 全屏 + 离线）：用 `https://<局域网IP>:8443`（需 ssl/ 证书，本地已配）

---

## 二、Docker 一键部署（推荐，任意云/本地都通用）

在 `workbench` 目录下构建并运行：

```bash
# 构建镜像
docker build -t workbench .

# 运行（把容器 8080 映射到宿主机 8080）
docker run -d --name workbench -p 8080:8080 --restart unless-stopped workbench
```

- 云平台（Railway / Render / Fly.io / 阿里云轻量 / 腾讯云轻量）直接连 Git 仓库或上传目录即可，
  它们会**自动设置 `PORT` 环境变量**，无需改代码。
- 国内轻量云记得在**安全组/防火墙放行 8080**（或你映射的端口）。

---

## 三、各平台建议

| 平台 | 国内访问 | 备注 |
|------|----------|------|
| 阿里云 / 腾讯云轻量应用服务器 | ⭐ 快且稳 | 需自有域名 + ICP 备案；用 Nginx/Caddy 反代做 HTTPS |
| Railway | 较慢 | 国外，后台部署方便，自动给 HTTPS 域名 |
| Render | 较慢 | 国外，免费额度有限，自动 HTTPS |
| Fly.io | 较慢 | 国外，可指定区域 |
| Cloudflare Pages / Vercel | ⚠️ 不可行 | 仅托管静态前端，本项目后端 API 代理需 Node 运行时，这些纯静态平台跑不了 |

> ⚠️ 你的网络环境对 Cloudflare / ngrok 隧道出口有封锁，故**不要**走 `cloudflared`/`ngrok` 方案。
> 用上面的 Docker 容器平台最稳。

---

## 四、HTTPS 与 PWA（iPhone 全屏 / 离线缓存）

- 静态托管平台（Railway/Render/轻量云+Nginx）通常**自动提供 HTTPS**，PWA 可直接安装。
- 若用纯 IP + HTTP，Service Worker 不会注册（非安全上下文），但**在线使用完全正常**，只是不能离线。
- 想 iPhone「添加到主屏幕」全屏且无证书警告：务必走 HTTPS 域名。

---

## 五、数据迁移（关键！换设备 / 上云必做）

localStorage 是**按域名/源隔离**的。换域名或换设备后，旧数据不会自动跟过来。
用工作台内置的「**数据备份**」功能迁移：

1. **旧环境**（你现在的电脑）打开工作台 → 左侧「数据与系统 → 数据备份」→
   「⬇️ 导出备份」，下载一个 `workbench-backup-YYYY-MM-DD.json`。
2. **新环境**（云服务器 / 新手机）打开工作台 → 「数据备份」→
   「⬆️ 导入备份」，选刚才的 JSON → 确认覆盖 → 页面自动刷新，数据完整回来
   （含打卡、计划、记账、游戏进度、微信读书 Cookie 等）。
3. 微信读书 Cookie 导入后可能已过期，若同步失败请重新在「每日阅读」页设置一次。

> 导出文件只存在你本地下载目录，不会上传到任何服务器；如需彻底删除痕迹，删掉该 JSON 即可。

---

## 六、注意事项

- 服务器要一直运行（容器用 `--restart unless-stopped` 可宕机自启）。
- 多设备各自有独立 localStorage；想多端同步需每次手动导出/导入，或后续接入云同步（如 Supabase）。
- 理财知识、新闻/视频/新剧数据来自外部 API（经本服务器代理），部署后照常可用，无需额外配置。

---

## 七、连 Git 仓库 · 零配置部署（Railway / Render / Fly.io）

适合「不想碰服务器、连上 Git 就自动部署 + HTTPS」的场景。三平台都靠 `package.json` 里的 `start` 脚本自动识别启动命令，端口读 `process.env.PORT`，**无需改代码**。

### 准备（本机一次性，仓库已就绪）
```bash
cd workbench
git init
git add -A
git commit -m "workbench: ready for cloud deploy"

# 在 GitHub 新建一个空仓库（不要勾 README / .gitignore），然后：
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### Railway（最省心，推荐）
1. 打开 https://railway.app → 用 GitHub 登录。
2. New Project → **Deploy from GitHub repo** → 选刚才的仓库。
3. 自动识别 Node：`npm install`（无依赖，秒过）+ `npm start` 启动；端口读 `PORT`。
4. 进入项目 → Settings → 复制生成的 `*.railway.app` 域名（**已自带 HTTPS**）。
5. 打开该域名即用；iPhone：Safari 打开 → 分享 → 添加到主屏幕 → 全屏 PWA。

### Render（免费额度有限）
1. 打开 https://render.com → 用 GitHub 登录。
2. New → **Web Service** → 连仓库。
3. 关键设置：Build Command 留空（或 `npm install`），Start Command 填 `npm start`，实例类型选 **Free**。
4. 部署完给一个 `*.onrender.com` 域名（自带 HTTPS）。
5. 免费实例 15 分钟无访问会休眠，首次打开需等几秒唤醒。

### Fly.io（可选，可指定近区）
1. 安装 flyctl 并登录；`fly launch` 自动生成 `fly.toml`，区域选 `hkg`（香港）更近。
2. `fly deploy` → 给 `*.fly.dev` 域名（HTTPS）。

### 上线后必做：迁移数据
用工作台「数据备份」导出旧数据 → 新域名里「导入备份」覆盖（见第五节）。

> ⚠️ **代理目标注意**：新闻/视频/新剧/微信读书均经本服务器向**国内接口**请求。
> 若部署在海外节点，这些接口可能超时/返回空——应用会**优雅降级**（不会影响其他功能与页面）。
> 要保证这几个模块稳定，建议用**国内云**（阿里云/腾讯云轻量，见第三节）或改写 `server.js` 代理源。
> 其余功能（打卡/计划/记账/游戏化/周报）纯前端 + localStorage，部署到任何平台都完全正常。
