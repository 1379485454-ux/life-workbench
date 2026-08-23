# 微信小程序方案（MVP 已搭建 · 开发中）

> 目标：把现有网页工作台（PWA）的能力延伸到微信小程序，并**与网页共用同一份数据**，实现「网页 ↔ 小程序」双向互通。
> 状态：**MVP 已搭好**（`miniprogram/` 原生小程序），今日任务清单 + 勾选打卡 + 加任务 + 完成度，复用 `/api/sync`。待小程序账号 + 域名备案后真机互通。

---

## 一、结论（先说可行性）

**完全可行，且数据互通几乎零成本。**

原因：你现在的后端 `server.js`（部署在 Render）已经是一个**标准的 HTTPS 同步 API**，所有数据都通过它读写：

```
GET  https://life-workbench.onrender.com/api/sync?user_id=edys-workbench
     → { items: [ { key:'wb_lifecenter', value:{...} }, ... ], maxTs, serverTime }

POST https://life-workbench.onrender.com/api/sync
     body: { user_id, items:[{key,value,updated_at}], deletes:[...] }
```

- 网页端：localStorage 代理自动把 `wb_*` 键推送到这个接口。
- 小程序端：**只要用 `wx.request` 调同一个接口即可读写同一份数据**，无需新建数据库。
- 行业资料一致结论：网站与小程序共用一套后端 API、数据互通是标准且推荐的架构。

---

## 二、整体架构

```
        ┌─────────────┐         ┌─────────────┐
        │  网页 PWA    │         │ 微信小程序   │
        │ (已有, 先打磨)│         │ (规划中)     │
        └──────┬──────┘         └──────┬──────┘
               │                       │
               │  同一个 HTTPS 接口      │
               └─────────┬─────────────┘
                         ▼
                ┌─────────────────────┐
                │  server.js (Render)  │
                │  /api/sync           │
                │  data/kv_store.json  │  ← 唯一数据源
                └─────────────────────┘
```

- **展示层分离**：网页和小程序各自是独立前端，只通过 `/api/sync` 交互，互不影响发布节奏。
- **数据层统一**：都以 `user_id=edys-workbench` 为根，键名 `wb_*` 完全一致 → 天然互通。
- **冲突处理**：沿用网页已有的 `updated_at` 时间戳 + 全量 last-write-wins 策略，小程序无需重新设计。

---

## 三、小程序端技术选型

| 方案 | 说明 | 适合度 |
|------|------|--------|
| **Taro / uni-app** | 用 React/Vue 语法一套代码编译到微信小程序 | ⭐⭐⭐ 复用逻辑、开发快 |
| 微信原生框架 | WXML/WXSS/JS，官方 IDE | ⭐⭐ 最贴近平台、但纯手写 |

**推荐 Taro（React 语法）**：你网页是原生 JS，Taro 的组件/状态思路接近，且能把「今日任务、目标分支、打卡」等纯逻辑抽成共享模块，后续若要出 H5/支付宝小程序也能复用。

---

## 四、数据互通具体做法

1. **读今日数据**：`wx.request({ url: 'https://life-workbench.onrender.com/api/sync?user_id=edys-workbench' })` → 取 `wb_lifecenter` → 过滤 `today` 中 `date === 今天`。
2. **写回改动**：勾选完成 / 新增任务 → `POST /api/sync`，`items` 带最新 `wb_lifecenter`（含 `updated_at=Date.now()`）。
3. **增量拉取**：用上次 `maxTs` 做 `since` 参数，只拉变更，省流量。
4. **身份**：个人单机场景直接用固定 `user_id=edys-workbench`（与网页一致）；若要多人/多设备，再加 `wx.login → code → openid` 绑定，后端签发 token（预留，本期不做）。

---

## 五、上线前必须准备的账号与配置

| 项目 | 说明 | 谁提供 |
|------|------|--------|
| 微信小程序账号 | 个人号（有限制）或企业号（功能全） | 你 |
| AppID | 小程序后台获取 | 你 |
| **request 合法域名** | 在 MP 后台配置 `https://life-workbench.onrender.com` 加入 request 白名单 | 你（需域名已 ICP 备案） |
| HTTPS | Render 已提供，无需额外处理 | 已有 |
| 微信审核 | 首次发布需提交审核（类目、隐私协议） | 你 + 我 |

> ⚠️ 关键坑：微信要求 `request` 域名**必须 HTTPS 且在微信后台白名单**，且域名需 ICP 备案。你的 Render 域名若未备案，需先备案或换国内可备案域名/CDN。

---

## 六、分阶段计划

- **P0（当前）网页体验打磨**：今日任务简化（扁平清单+展开）、「添加到主屏幕」引导、每日邮件概览 —— 先解决「用起来」。
- **P1 抽象同步层**：把网页里 `/api/sync` 的读写抽成独立 `syncClient.js`，网页与小程序的共享数据模块。
- **P2 小程序 MVP**：用 Taro 实现「今日任务清单 / 勾选打卡 / 加任务 / 完成度」，复用 P1 同步层。
- **P3 增强 + 审核发布**：目标分支辐射图、AI 助手入口、提交微信审核、灰度发布。

---

## 七、与 PWA 的关系（不冲突）

- **PWA**（现在就用）：添加到主屏幕即 App、免审核、随时更新、跨平台 —— 主攻「让你每天打开」。
- **微信小程序**（后续）：微信内扫码即开、生态触达强、可发模板消息/订阅通知 —— 主攻「微信里的轻量入口」。
- 两者共用同一后端，数据实时一致，不二选一，组合使用。

---

## 八、待你确认的事项

1. 是否有微信小程序账号（个人 / 企业）？AppID 是否就绪？
2. Render 域名是否已完成 ICP 备案（决定能否直接配白名单）？
3. 小程序 MVP 优先要哪些功能？（建议：今日任务 + 打卡 + 加任务）
4. 是否接受先用 PWA 把「每日打开」习惯养成，小程序作为第二阶段？

---

## 九、MVP 已落地代码（2026-08-23）

目录 `miniprogram/`（原生微信小程序框架）：

```
miniprogram/
├── app.js / app.json / app.wxss       # 全局配置（暗色主题，匹配网页）
├── project.config.json                # 开发者工具配置（appid: touristappid，urlCheck:false）
├── sitemap.json
├── utils/sync.js                      # 同步层：wx.request 调 /api/sync，读写 wb_lifecenter
└── pages/today/
    ├── today.js / .json / .wxml / .wxss   # 今日任务页：清单 + 勾选打卡 + 加任务 + 完成度
```

**关键实现**：
- 数据互通：小程序 `utils/sync.js` 直接 `wx.request` 调网页同一接口 `GET/POST /api/sync?user_id=edys-workbench`，键名 `wb_lifecenter` 完全一致 → 与网页天然双向互通。
- 今日任务：`today.js` 过滤 `wb_lifecenter.today` 中 `date === 今天`，显示完成度、分支、时段、耗时；点任务行勾选即写回。
- 加任务：写入 `wb_lifecenter.today`，网页端即时可见。

**运行方式（域名未备案的临时方案）**：
1. 下载微信开发者工具 → 导入项目 → 选择 `miniprogram/` 目录。
2. AppID 填你的小程序号（或个人号测试号）；`project.config.json` 默认 `touristappid`，可直接用测试号预览。
3. 右侧「详情 → 本地设置」勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**——因为 Render 域名未备案，不勾会被微信拦截。
4. 编译即可预览：今日任务从你网页的真实数据拉取，勾选/添加实时同步回网页。

**真机/发布前置（备案后）**：
- 把 `https://life-workbench.onrender.com` 加入小程序后台「开发 → 开发管理 → 开发设置 → 服务器域名 → request 合法域名」白名单。
- 域名需完成 ICP 备案（Render 默认域名通常未备案；需绑定已备案自定义域名或换国内可备案服务）。
- 之后取消「不校验合法域名」，即可真机运行并提审发布。

**后续可扩展**：目标分支辐射图、周期动作、AI 助手入口（复用 P1 抽象同步层思路）。
