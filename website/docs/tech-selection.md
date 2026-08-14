# 技术选型说明（论文素材）

## 1. 总体技术路线

前后端分离架构：**Vue 3 SPA + Express REST/SSE + MySQL**。统一 JavaScript 技术栈，降低上下文切换成本；前端静态构建、后端纯 API，天然解耦，便于分别测试与部署。

| 层次 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Vue 3（Composition API） | ^3.5 |
| 构建工具 | Vite | ^6 |
| UI 组件库 | Element Plus | ^2.8 |
| 状态管理 | Pinia | ^2.2 |
| 路由 | Vue Router | ^4.4 |
| HTTP 客户端 | Axios | ^1.7 |
| 后端框架 | Express | ^5.1 |
| 数据库 | MySQL | 8.0 |
| 数据库驱动 | mysql2（连接池 + 预编译语句） | ^3.11 |
| 安全头 | Helmet | ^8 |
| 密码哈希 | Node 内置 crypto.scrypt | — |
| 验证码 | 手写 PNG 位图（zlib + 手写 CRC32） | — |
| 依赖数量 | 后端仅 4 个第三方包 | — |

## 2. 关键选型对比

### 2.1 前端框架：Vue 3 vs React vs 原生小程序

| 维度 | Vue 3 + Vite | React | 原生小程序 |
|---|---|---|---|
| 学习曲线 | 平缓（模板语法直观） | 中等（JSX/Hooks 心智模型） | 平台绑定 |
| 开发体验 | Vite 秒级热更新 | 同样支持 Vite | 依赖开发者工具 |
| 生态（国内） | Element Plus 中文文档完善 | Ant Design 成熟 | 组件生态有限 |
| 部署形态 | 任意静态托管 / Nginx | 同左 | 需微信审核发布 |

**选择理由**：本课题由微信小程序演示项目重构而来，选择 Web 形态可获得零审核的部署路径与更完善的组件生态；Vue 3 的模板语法与 Composition API 适合团队协作，Element Plus 提供课表/成绩等业务所需的表格、表单、下拉组件。

### 2.2 后端框架：Express vs Spring Boot vs NestJS

| 维度 | Express | Spring Boot | NestJS |
|---|---|---|---|
| 语言 | JavaScript（前后端统一） | Java | TypeScript |
| 学习成本 | 低 | 高（需 Java 生态知识） | 中高（DI/装饰器范式） |
| 中间件生态 | 丰富 | 丰富 | 较新 |
| 流式响应（SSE） | 原生支持 res.write | 需 SseEmitter | 支持 |

**选择理由**：项目为课程设计/毕业设计体量，Express 的"最小内核 + 中间件"模型足够且可读性强；SSE 流式接口（AI 对话）在 Express 下用原生 `res.write` 即可实现，无额外抽象。

### 2.3 数据库：MySQL vs SQLite vs PostgreSQL

| 维度 | MySQL | SQLite | PostgreSQL |
|---|---|---|---|
| 部署形态 | 独立服务 | 单文件嵌入式 | 独立服务 |
| 并发写入 | 支持 | 受限（单写者） | 支持 |
| JSON 类型 | 8.0 原生支持 | 文本存储 | JSONB 最强 |
| 毕设通用性 | **最主流，答辩认可度高** | 轻量 | 国内使用较少 |

**选择理由**：教务场景涉及学生、选课、成绩、考试、资讯等多实体关联，需要 FK 约束与事务；MySQL 是国内高校信息化系统的主流选择，E-R 设计与答辩演示的通用性最好。MySQL 8 的 JSON 列用于存储指南条目与资讯的结构化段落内容。

### 2.4 登录态：服务端 token 表 vs JWT

| 维度 | 服务端 token 表 | JWT |
|---|---|---|
| 可吊销 | **DELETE 一行即吊销（登出/换密码）** | 无状态，吊销需黑名单 |
| 数据库设计 | sessions 实体，E-R 更完整 | 无表 |
| 依赖 | 零（crypto.randomBytes） | jsonwebtoken 包或手写 HMAC |
| 续期 | UPDATE 顺延 expires_at，直观 | 需 refresh token 双令牌 |

**选择理由**：毕设需要可演示的"退出登录即失效"与滑动续期；sessions 表丰富了数据库 E-R 设计章节；零依赖符合项目最小供应链原则。

### 2.5 密码哈希：scrypt vs bcrypt

| 维度 | scrypt（Node 内置） | bcrypt |
|---|---|---|
| 依赖 | 零 | C++ 原生模块（Windows 编译风险） |
| 算法性质 | 内存困难型 KDF（OWASP 推荐） | 计算困难型 |
| 参数化 | N/r/p 可写入哈希串 | cost 因子 |

**选择理由**：`crypto.scryptSync(N=16384, r=8, p=1)` 内存与 CPU 双重开销，抗彩虹表与 GPU 爆破；哈希串自带参数（`scrypt$N$r$p$salt$hash`），未来可平滑升级参数。

### 2.6 AI 流式：SSE vs WebSocket vs 轮询

| 维度 | SSE | WebSocket | 轮询 |
|---|---|---|---|
| 方向 | 单向（服务端→客户端） | 双向 | 双向（伪） |
| 实现成本 | HTTP 原生，无协议升级 | 需 ws 库与心跳 | 最简单但延迟高 |
| 断线恢复 | EventSource 自动重连（本方案 fetch 手动控制） | 需自实现 | 天然 |

**选择理由**：AI 对话是"请求-流式应答"的单向流场景，SSE 足够；HTTP 请求携带 POST body（问题文本）比 WebSocket 握手后自定义消息更简单；本方案前端用 fetch + ReadableStream 读取（POST 场景 EventSource 不支持），并可用 AbortController 实现"停止生成"。

## 3. 依赖最小化说明

后端生产依赖仅 4 个：express、mysql2、helmet、dotenv。验证码 PNG 编码、密码哈希、令牌桶限流、token 生成全部使用 Node 内置模块实现，可作为论文"供应链安全/工程能力"的论述点。
