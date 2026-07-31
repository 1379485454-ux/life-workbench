# 个人工作台 · 国内服务器部署指南

> 适用场景：你想要「手机/电脑任意网络都能秒开、国内访问飞快、数据实时同步」的终极方案。
> 项目本身是**纯前端 + Node 代理**，代理的全部是**国内接口**（头条 / B站 / 抖音 / 豆瓣 / 微信读书），
> 所以**部署到国内比海外（Render）更合适、更快、更稳**。

---

## 一、要准备什么（硬性清单）

| 准备项 | 说明 | 哪里办 | 费用 | 周期 |
|--------|------|--------|------|------|
| **① 域名** | 需要国内注册并可实名认证的域名（`.com`/`.cn`/`.top` 等均可） | 阿里云万网 / 腾讯云 DNSPod | 50~80 元/年 | 即时 |
| **② 云服务器** | 国内轻量应用服务器（2核2G 足够跑这个工作台） | 阿里云 / 腾讯云 / 华为云 | 60~120 元/月 | 即时 |
| **③ ICP 备案** | **国内服务器的硬性要求**，不备案域名无法解析到国内 IP 的 80/443 端口 | 在服务器厂商（阿里云/腾讯云）后台提交 | 免费 | **7~20 个工作日** |
| **④ HTTPS 证书** | PWA 全屏安装 + 安全上下文必需 | 阿里云/腾讯云免费 DV 证书，或 certbot | 免费 | 即时 |
| **⑤ 同步后端** | 把海外 Supabase 换成国内方案（见第四节） | 见 sync-selfhost.md | 免费 | 约 1 小时 |

> 💡 备案是**唯一耗时项**，建议先买服务器+域名、提交备案，备案期间不影响你写代码/测试。
> 备案提交后域名不能访问国内服务器（会显示"未备案"拦截页），这是正常的。

---

## 二、总成本估算

- 域名：~70 元/年
- 服务器：~ 720~1440 元/年（轻量 2核2G，按活动价 60~120/月）
- 备案 + SSL：0 元
- **合计：约 800~1500 元/年**（一杯奶茶钱/天，换 7×24 在线 + 国内极速）

---

## 三、部署步骤（备案通过后）

### 1. 服务器装环境
```bash
# 以 Ubuntu 22.04 为例
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2        # 进程守护（或改用 Docker，见下）
```

### 2. 拉代码 + 启动
```bash
cd /opt
git clone https://github.com/1379485454-ux/life-workbench.git
cd life-workbench
node -c server.js              # 语法自检
pm2 start deploy-cn/ecosystem.config.js   # 守护进程，监听 8080
pm2 save && pm2 startup        # 开机自启
```

> 或用 Docker（项目根目录已有 Dockerfile）：
> ```bash
> docker build -t workbench .
> docker run -d --name workbench -p 8080:8080 --restart unless-stopped workbench
> ```

### 3. 配 Nginx 反代 + HTTPS
把 `deploy-cn/nginx.conf` 复制为 `/etc/nginx/sites-available/workbench`，
软链到 `sites-enabled`，把里面的 `your-domain.com` 换成你的域名，证书路径换成实际路径，然后：
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. 域名解析 + 等备案生效
到域名控制台把 `A 记录` 指向服务器公网 IP。备案通过后（通常 1~3 周），
用手机流量打开 `https://你的域名` 即可，iPhone Safari「添加到主屏幕」即全屏 PWA。

---

## 四、同步后端：已改为同源自建（方案 B 已实现 ✅）

> 代码已落地：数据同步不再依赖海外 Supabase，改为**同源 `/api/sync` 接口**
> （`server.js` 内置，用 `data/kv_store.json` 文件存储，零依赖、零额外配置）。
> `js/sync.js` 已重写为请求该接口，每 4 秒轮询增量 + 防抖推送，实现多端近实时同步。

为什么不再用 Supabase：原方案同步请求发往海外 `supabase.co`，
iOS Safari 的「阻止跨站跟踪 / 内容拦截器 / Private Relay」会直接丢弃这类跨站请求，
表现为 `TypeError: Load failed`。改为**同源请求**后该问题消失，国内访问也更快。

三种部署形态对同步的影响：

| 部署方式 | 同步后端 | 效果 |
|----------|----------|------|
| **Node 服务器**（Render / 国内服务器 / 本地） | 同源 `/api/sync`（已内置） | ✅ 多端实时同步，数据存服务器 `data/` |
| **CloudStudio 静态部署**（仅静态文件，无 server.js） | 探测不到 `/api/sync` | ⚠️ 自动降级为「本机模式」：仅本机可用，不同步 |

> CloudStudio 静态部署如需同步，可改用 Node 类部署（Render / 国内服务器），
> 或在 CloudStudio「绑定自定义后端」里指向任意一台运行了 `server.js` 的服务器。

数据持久化提醒：自建同步数据写在服务器 `data/kv_store.json`。
- **国内服务器 / 本地**：随服务器磁盘持久保存（重要数据建议定期备份该文件）。
- **Render 免费版**：容器文件系统为临时盘，部署/休眠后可能被重置；
  因各端 localStorage 为本地副本，重置后从任一设备重新打开即自动恢复（pushAll）。
  如需 Render 上持久，可挂载 Render Disk 或将存储换成云数据库。

---

## 五、验证清单

- [ ] 手机流量打开 `https://域名`，秒开、无证书警告
- [ ] iPhone「添加到主屏幕」后全屏（无 Safari 地址栏）
- [ ] 电脑改一条数据 → 手机刷新 1~2 秒内出现（同步正常）
- [ ] 新闻/视频/豆瓣模块显示**真实**数据（非「内置示例」）
- [ ] 微信读书 Cookie 配置后书架正常加载

---

## 六、注意

- 服务器要一直运行（PM2 `--restart` / Docker `--restart unless-stopped` 已处理宕机自启）。
- 换域名/换服务器后，旧数据用工作台内置「数据备份」导出 → 新环境导入即可迁移。
- 本项目无需数据库（除同步后端外），文件型存储足够。
