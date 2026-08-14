# 系统架构设计（论文素材）

## 1. 总体架构

三层 B/S 架构，前后端分离：

```
┌─────────────────────────────────────────────────────────┐
│  表现层：Vue 3 SPA（Vite 构建，浏览器运行）                │
│  视图层 views/ · 组件 components/ · 状态 Pinia            │
│  通信层 utils/request.js（Axios：token 注入/信封解包）     │
│  AI 流式：fetch + ReadableStream 解析 SSE 帧              │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/JSON + SSE（同源 /api）
                           ▼
┌─────────────────────────────────────────────────────────┐
│  应用层：Express 5（Node.js）                             │
│  中间件链：helmet → CORS → express.json(100kb) → 路由     │
│  ├─ 认证：scrypt 校验 / token 签发与滑动续期 / 限流        │
│  ├─ 业务路由：auth / edu / guide / news / favorites        │
│  │            checklist / applications / chat(SSE)        │
│  ├─ 服务层：guide(内存索引搜索) · coze(AI 护栏/兜底)       │
│  └─ 安全：手写 PNG 验证码 / 令牌桶 / 预编译 SQL             │
└──────────────┬───────────────────────────┬──────────────┘
               │ mysql2 连接池               │ HTTPS（可选）
               ▼                             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ 数据层：MySQL 8           │   │ 外部服务：Coze Chat API   │
│ 11 张表（utf8mb4）        │   │ （无凭据时本地 KB 兜底）    │
│ FK 约束 · 事务 · 预编译    │   │ 流式 SSE · 45s 看门狗      │
└──────────────────────────┘   └──────────────────────────┘
```

## 2. 开发/部署拓扑

- 开发：Vite dev server（5173）通过 proxy 将 `/api` 转发到后端（8000），**同源免 CORS**；SSE 流式经 http-proxy 原生透传。
- 生产：`vite build` 产物由 Nginx 托管，`/api` 反代到 Node 服务；域名需 HTTPS（微信/浏览器安全策略与登录态安全）。

## 3. 关键模块职责

| 模块 | 文件 | 职责 |
|---|---|---|
| 认证中间件 | back/src/middleware/auth.js | Bearer token 校验、滑动续期（剩余<50% 且距上次>1h 才 UPDATE，节流）、挂载 req.student |
| 限流中间件 | back/src/middleware/rate-limit.js | 内存令牌桶（容量+匀速补充），chat 与 login 独立桶参数 |
| 验证码 | back/src/utils/captcha.js | 5×7 点阵数字绘制、手写 PNG 编码、3 分钟过期/一次性/5 次作废状态机 |
| 密码工具 | back/src/utils/password.js | scrypt 哈希（参数入串）、timingSafeEqual 常量时间比对 |
| 指南服务 | back/src/services/guide.js | 全量内存索引（22 条）、关键词打分搜索、高亮分段 |
| AI 服务 | back/src/services/coze.js | 主题护栏、会话映射、本地 KB 兜底、Coze v3 SSE 流式 + 看门狗 |
| 前端请求封装 | front/src/utils/request.js | token 注入、`{code,message,data}` 信封解包、40101 自动登出跳登录 |

## 4. 核心时序

### 4.1 登录时序

```
用户 → 登录页 → POST /api/auth/captcha → 服务端生成验证码存入内存 Map，返回 PNG(data URI)
用户填写学号/密码/验证码 → POST /api/auth/login
  → 限流检查（IP 桶 5/分钟、学号桶 5/15 分钟）
  → 验证码校验（一次性，错 5 次作废）
  → SELECT students WHERE student_no → scrypt 慢哈希比对
  → 事务：删除旧 token + 插入 sessions（7 天）
  → 返回 {token, student} → 前端存 localStorage，路由守卫放行
```

### 4.2 课表查询时序

```
用户（已登录）→ GET /api/edu/schedule?semester=...
  → requireAuth：查 sessions JOIN students → 滑动续期
  → 查 course_selections JOIN courses → 前端绝对定位渲染课程卡
```

### 4.3 AI 流式对话时序

```
用户输入 → POST /api/chat（fetch，stream:true）
  → 预检：护栏（OFF_TOPIC 列表）→ 限流 → 凭据判断
  → 无凭据：本地 KB/指南搜索兜底，SSE 一次性输出
  → 有凭据：转发 Coze v3，逐 chunk 归一化为 {"t":"d","c":增量} 帧
  → {"t":"end"} 结束；客户端断开 → AbortController 中止上游
```

## 5. 前端目录结构

```
front/src/
├── api/          # 接口定义（auth/edu/news/guide/user）
├── components/   # DemoBadge/EmptyState/SearchHighlight/layout/MainLayout
├── stores/       # pinia：auth（token 持久化）
├── utils/        # request(axios 封装)/schedule(节次与配色)/validate(表单规则)
├── views/        # 15 个页面视图
└── styles/       # theme.css（Element Plus 主题变量九档覆盖）
```
