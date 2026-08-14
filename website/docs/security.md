# 安全设计（论文素材）

## 1. 密码安全

- **存储**：`crypto.scrypt`（Node 内置，OWASP 推荐的密码 KDF），参数 N=16384、r=8、p=1、keylen=64、随机 16B 盐。存储格式 `scrypt$16384$8$1$<salt_hex>$<hash_hex>`——参数随哈希入库，未来升级参数无需迁移旧数据。
- **比对**：`crypto.timingSafeEqual` 常量时间比较，防时序侧信道。
- **防护对象**：彩虹表（加盐）、GPU 暴力破解（scrypt 内存困难）、拖库后明文泄露（绝不明文存储）。
- **传输**：登录接口接受明文密码，生产环境必须部署 HTTPS；开发期走 Vite 同源 proxy。

## 2. 登录防爆破

| 机制 | 参数 | 说明 |
|---|---|---|
| 图形验证码 | 4 位数字 | 手写 PNG 位图；3 分钟过期；**一次性**（校验即删）；同 id 错 5 次作废 |
| IP 限流 | 5 次/分钟 | 令牌桶，登录接口 |
| 学号限流 | 5 次/15 分钟 | 令牌桶，按目标学号维度（防撞库） |
| 会话隔离 | 单端登录 | 新登录删除该学号旧 token |

验证码状态机（内存 Map + 10 分钟定时清理）：
- 不存在/过期 → 拒绝；
- attempts ≥ 5 → 删除作废；
- 输入正确 → 删除并放行（一次性）；
- 输入错误 → attempts+1。

登录失败同样消耗验证码（密码错后需换新验证码重试），阻断"固定验证码批量试密码"。

## 3. 登录态与令牌生命周期

- token = `crypto.randomBytes(32).toString("hex")`（256 位熵，不可预测）。
- 服务端 sessions 表存储，7 天有效期；**滑动续期**：剩余有效期 < 50% 且距上次使用 > 1 小时才顺延（节流防写放大）。
- 登出/清数据即 `DELETE` 行——服务端可吊销，与 JWT 对比见表（docs/tech-selection.md §2.4）。
- 前端 token 仅存 localStorage，密码任何路径不落盘。

## 4. 注入与 XSS 防护

| 威胁 | 措施 |
|---|---|
| SQL 注入 | 全部查询 `pool.execute(sql, params)` 预编译参数化（LIMIT 参数经 parseInt 强转后内插，见代码注释） |
| 存储型 XSS | 资讯/指南正文为结构化 JSON 段落（`[{h,p}]`），Vue 插值默认转义，**全项目零 v-html / rich-text**；数据形态上不含 HTML |
| 请求体攻击 | `express.json({limit:"100kb"})` 上限；消息长度 slice(0,2000)；sessionId slice(0,64) |
| 响应头 | helmet 默认安全头（X-Content-Type-Options、X-Frame-Options 等） |
| 路径注入 | 前端路由参数仅作查询键，后端 `?` 占位符绑定 |

## 5. 接口防护

- **令牌桶限流**（`middleware/rate-limit.js`，算法见 docs/algorithms.md）：
  - AI 对话：每 IP 30 枚/1 枚每秒；每会话 20 枚/1 枚每 30 秒；
  - 登录：见 §2。
- **SSE 生命周期**：上游 45s 无 chunk 看门狗中止；客户端断开（`req.on("close")`）联动 AbortController 中止上游 fetch，防连接与资源泄漏。
- **越权防护**：所有业务查询以 `req.student.studentNo`（token 反查所得）为条件，客户端传入的学号不被信任；申请删除 `WHERE id = ? AND student_no = ?` 双重条件。
- **前后端双重校验**：表单按 schema（required/format/maxlength）在前端 `utils/validate.js` 与后端 `utils/format.js` 同规则校验，规则源自同一份定义。

## 6. 已知边界（诚实声明，答辩可答）

- 验证码存于服务端内存：多实例部署需换 Redis；本系统单实例演示。
- 限流桶内存态：重启即清零（演示友好）；生产可换持久化计数。
- DEBUG_CAPTCHA=1（开发环境变量）时验证码响应附明文——README 醒目声明仅限本地测试。
- 未配置 Coze 凭据时 AI 走本地知识库兜底，不向第三方发送任何用户数据。
