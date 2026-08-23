# 微信小程序方案（MVP 已搭建 · 云开发免备案路线）

> 目标：把现有网页工作台（PWA）延伸到微信小程序，与网页**共用同一份数据**（`wb_lifecenter`），实现「网页 ↔ 小程序」双向互通。
> 状态：**MVP 已搭好**（`miniprogram/` 原生小程序），今日任务清单 + 勾选打卡 + 加任务 + 完成度。
> 关键决策（2026-08-23）：**走「微信云开发云函数中转」路线 —— 免备案、几乎零成本**，真机即可数据互通。

---

## 一、结论（可行性）

**可行，且数据互通零成本、免 ICP 备案。**

### 为什么不用备案？
微信小程序要求用 `wx.request` **直连自有域名**时，该域名必须 HTTPS + 已 ICP 备案（微信客户端层硬拦）。但用**微信云开发云函数**中转则不受此限：

- 小程序请求的是微信自己的云函数通道（`wx.cloud.callFunction`），**不触发 request 合法域名 / 备案校验**。
- 云函数运行在服务端，由它去访问你的 Render 接口（海外域名没关系）。
- 因此**小程序侧完全无需备案、无需配置合法域名**，真机直接跑。

### 费用
- **ICP 备案本身免费**，但直连路线要求买国内服务器（几百元/年）+ 域名。我们不走这条路，所以**不花这笔钱**。
- 微信云开发有**免费额度**，个人工作台这种低频请求基本不花钱；超出才按量计费。

---

## 二、整体架构（云函数中转）

```
        ┌─────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
        │  网页 PWA    │         │   微信小程序           │         │ 云函数 syncProxy     │
        │ (已有)       │         │ (miniprogram/)        │         │ (微信云开发 Node)    │
        └──────┬──────┘         └──────────┬───────────┘         └──────────┬──────────┘
               │  同一个 HTTPS 接口          │  wx.cloud.callFunction         │  fetch
               │                            └──────────────┬─────────────────┘
               └────────────────┬───────────────────────────┘
                                ▼
                       ┌─────────────────────┐
                       │  server.js (Render)  │
                       │  /api/sync           │
                       │  data/kv_store.json  │  ← 唯一数据源
                       └─────────────────────┘
```

- **网页端**：照旧，localStorage 代理把 `wb_*` 推到 `/api/sync`，**一行都不用改**。
- **小程序端**：`utils/sync.js` → 调云函数 `syncProxy` → 云函数打 `/api/sync`，读写 `wb_lifecenter`。
- **数据层统一**：都以 `user_id=edys-workbench` 为根，键名完全一致 → 天然互通、last-write-wins。

---

## 三、小程序端技术选型

| 方案 | 说明 | 适合度 |
|------|------|--------|
| **微信原生框架** | WXML/WXSS/JS + 云开发，官方 IDE 直接跑 | ⭐⭐⭐ 最快出 MVP、免构建 |
| Taro / uni-app | React/Vue 语法跨端 | ⭐⭐ 启动稍重，本期未采用 |

**当前采用微信原生 + 云开发**：已搭好 MVP，无需 Node 构建链，用你的小程序号 + 开通云开发即可真机运行。

---

## 四、数据互通具体做法（云函数中转）

1. **读今日数据**：小程序 `getLifeCenter()` → `wx.cloud.callFunction('syncProxy', {action:'get'})` → 云函数 `GET /api/sync?user_id=edys-workbench` → 取 `wb_lifecenter` → 过滤 `today` 中 `date === 今天`。
2. **写回改动**：勾选 / 新增 → `saveLifeCenter(lc)` → 云函数 `POST /api/sync`，`items` 带最新 `wb_lifecenter`（含 `updated_at=Date.now()`）。
3. **身份**：个人单机场景固定 `user_id=edys-workbench`（与网页一致）；多人/多设备预留 `wx.login → openid` 绑定（本期不做）。
4. **首次使用**：若网页端尚未创建数据，`getLifeCenter` 返回一份骨架 `{today:[],branches:[],_v:2}`，避免写回 null 损坏数据。

---

## 五、上线前需要准备的（比备案路线简单得多）

| 项目 | 说明 | 谁提供 |
|------|------|--------|
| 微信小程序账号 | 个人号即可（云开发个人可用） | 你 |
| AppID | 小程序后台获取 | 你 |
| **微信云开发环境** | 开发者工具开通「云开发」，拿到环境 ID，填进 `app.js` 的 `CLOUD_ENV` | 你（免费额度） |
| 部署云函数 | 右键 `cloudfunctions/syncProxy` → 上传并部署 | 你（或我给步骤） |
| **ICP 备案** | **不需要** | — |
| request 合法域名 | **不需要配置** | — |

---

## 六、分阶段计划

- **P0（已完成）网页体验打磨**：今日任务简化（扁平清单+展开）、「添加到主屏幕」引导、每日微信推送（暂停待启用）。
- **P1（已完成）小程序 MVP**：原生框架 + 云开发，`今日任务 / 勾选打卡 / 加任务 / 完成度`，数据互通。
- **P2 增强**：目标分支辐射图、周期动作、AI 助手入口（复用同步层）。
- **P3 审核发布**：提交微信审核、灰度发布（云函数中转下无需备案即可真机）。

---

## 七、与 PWA 的关系（不冲突）

- **PWA**（现在就用）：添加到主屏幕即 App、免审核、随时更新 —— 主攻「每天打开」。
- **微信小程序**（云开发路线）：微信里轻量入口、数据互通 —— 主攻「微信里的随手入口」。
- 两者共用同一后端，数据实时一致，组合使用。

---

## 八、MVP 已落地代码

目录 `miniprogram/`（原生微信小程序 + 微信云开发）：

```
miniprogram/
├── app.js / app.json / app.wxss       # 全局配置（暗色主题）；app.js 含 wx.cloud.init(CLOUD_ENV)
├── project.config.json                # 开发者工具配置（appid: touristappid，urlCheck:false）
├── sitemap.json
├── utils/sync.js                      # 同步层：wx.cloud.callFunction('syncProxy')，读写 wb_lifecenter
├── cloudfunctions/syncProxy/
│   ├── index.js                       # 云函数：中转 GET/POST /api/sync，复用 wb_lifecenter
│   └── package.json
└── pages/today/
    ├── today.js / .json / .wxml / .wxss   # 今日任务页：清单 + 勾选打卡 + 加任务 + 完成度
```

**关键实现**：
- `utils/sync.js`：`getLifeCenter()` / `saveLifeCenter(lc)` 内部走 `wx.cloud.callFunction('syncProxy')`，**不再直连 Render**，故免备案。
- `cloudfunctions/syncProxy/index.js`：服务端用 `fetch` 打 `https://life-workbench.onrender.com/api/sync`，`action=get/save`，返回 `{lc}` 或 `{ok:true}`；出错返回 `{error}`。
- `pages/today/today.js`：过滤 `wb_lifecenter.today` 中 `date === 今天`，显示完成度、分支、时段、耗时；点任务行勾选即写回，网页端即时可见。

**运行方式（你本地）**：
1. 装微信开发者工具 → 导入项目 → 选择 `miniprogram/` 目录。
2. AppID 填你的小程序号（或个人测试号均可）；开通「云开发」拿到**环境 ID**，填进 `app.js` 的 `CLOUD_ENV`。
3. 右键 `cloudfunctions/syncProxy` → **上传并部署/部署**（把云函数发到你的云环境）。
4. 编译预览：今日任务从你网页真实数据拉取；勾选/添加实时同步回网页。
   - （可选）仍勾选「不校验合法域名…」以规避其他潜在请求，云函数本身免校验。

**真机运行（无需备案）**：
- 云函数中转下，真机直接可用，**无需 ICP 备案、无需配置 request 合法域名**。
- 仅当以后要用 `web-view` 在小程序里嵌网页、或配业务域名时，相关域名才需备案。当前纯数据互通不受影响。

**后续可扩展**：目标分支辐射图、周期动作、AI 助手入口（复用同步层）。
