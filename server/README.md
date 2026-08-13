# Coze 对话中转（server）

把「成电新生助手」的 AI 对话能力接到前端，由 Coze 智能体回答。前端不能直接安全持有 Coze 令牌（PAT），所以用这个零依赖 Node 服务做中转：前端 → 本服务 → Coze Chat API（国内版 `api.coze.cn`）。

- 无需 `npm install`，纯 Node 内置模块（Node 18+ 自带 `fetch`）。
- **单一数据源**：无凭据兜底直接 `require ../data/`，与小程序共用同一份知识库与条目数据，零漂移。
- **主题护栏**：与「电子科技大学成都学院新生」无关的话题（其他高校、编程、金融、医疗等）在调用 Coze 前拦截，不消耗额度。
- **令牌桶限流**：每 IP 30 枚（1 枚/秒补充）、每会话 20 枚（1 枚/30 秒补充），超限返回 429。
- **流式**：默认 `stream:true` 返回归一化 SSE；客户端不支持分块时可传 `stream:false` 拿一次性 JSON。

## 启动

```bash
cp .env.example .env   # 填入 COZE_PAT / COZE_BOT_ID（敏感，勿进版本库）
node coze-relay.js     # 监听 3000
```

## 接口

### POST /api/chat

请求：`{ "message": "报到流程是什么", "sessionId": "s_xxx", "stream": true }`

归一化 SSE（JSON 行）：

```
data: {"t":"d","c":"增量文本"}                 # 增量，可多行
data: {"t":"end"}                              # 正常结束
data: {"t":"err","code":"AI_ERROR","message":"..."}  # 中途失败，后随 end
```

预检错误（发生在流式开始前）返回普通 JSON：`{"error":{"code":"BAD_REQUEST|OFF_TOPIC|RATE_LIMITED","message":"..."}}`

非流式（`stream:false`）：`200 {"answer":"完整回答","sessionId":"..."}`

### GET /health

`{"ok":true,"configured":true|false,"ts":<毫秒>}`

## curl 验证

```bash
node coze-relay.js          # 无 .env 时 configured=false
curl -s http://127.0.0.1:3000/health

# 本地兜底（kb 命中）
curl -s -X POST http://127.0.0.1:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"报到流程是什么","sessionId":"t1","stream":false}'

# 护栏拦截
curl -s -X POST http://127.0.0.1:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"四川大学怎么样","sessionId":"t1","stream":false}'

# 限流：连发 35 次，尾部出现 429
for i in $(seq 1 35); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://127.0.0.1:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"你好","sessionId":"t1","stream":false}'; done

# 流式（配好 .env 后）
curl -N -X POST http://127.0.0.1:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"介绍一下宿舍","sessionId":"t1","stream":true}'
# 同一 sessionId 再发一条 → 复用 conversation_id 续聊
```

## 已知限制

- 会话映射（sid → conversation_id）存内存：服务重启后旧 sid 会开新会话。
- 小程序真机需把中转地址换成 **HTTPS 合法域名**（开发者工具可勾选「不校验合法域名」本地调试）。
- PAT 有有效期与权限范围，过期或权限不足会导致调用失败；Coze 调用计入账号额度。
