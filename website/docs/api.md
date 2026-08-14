# 接口文档（论文素材）

## 1. 统一协议

- 基础路径：`/api`；开发端口 8000（前端 Vite proxy 同源转发）。
- 成功：HTTP 200，`{ "code": 0, "message": "ok", "data": {...} }`
- 失败：HTTP 状态码同步，`{ "code": 4xxxx, "message": "..." }`
- 认证：请求头 `Authorization: Bearer <token>`（64 位 hex，7 天滑动续期）
- 特例：`/api/chat` 流内帧使用归一化 SSE 协议（见 §4）。

### 错误码表

| code | HTTP | 含义 |
|---|---|---|
| 0 | 200 | 成功 |
| 40001 | 400 | 参数缺失/格式错误 |
| 40101 | 401 | 未登录 / token 无效或过期 |
| 40102 | 401 | 学号或密码错误 |
| 40103 | 401 | 验证码错误/过期/已使用 |
| 40401 | 404 | 资源不存在 |
| 42901 | 429 | 触发限流 |
| 50000 | 500 | 服务端内部错误 |

## 2. 接口清单

| 方法 | 路径 | 认证 | 说明 | data 出参（要点） |
|---|---|---|---|---|
| GET | /api/health | 公开 | 健康检查 | `{db, aiConfigured, ts}` |
| GET | /api/school | 公开 | 学校信息（校区坐标） | data/school.js 全量 |
| POST | /api/auth/captcha | 公开 | 图形验证码 | `{captchaId, image(data URI)}` |
| POST | /api/auth/login | 公开+限流 | 登录 | `{token, student}` |
| POST | /api/auth/logout | Bearer | 登出（删 token 行） | `{}` |
| GET | /api/auth/me | Bearer | 当前学生 | student |
| GET | /api/edu/schedule | Bearer | 课表 | `{semesters, semester, courses[]}` |
| GET | /api/edu/grades | Bearer | 成绩+GPA | `{semesters, grades[], stats}` |
| GET | /api/edu/exams | Bearer | 考试安排 | `{exams[]}` |
| GET | /api/edu/student | Bearer | 学生信息 | student |
| GET | /api/news | 公开 | 资讯分页 | `{list, total, page, pageSize, hasMore}` |
| GET | /api/news/:id | 公开 | 资讯详情（views+1） | 完整资讯 |
| GET | /api/guide/collections | 公开 | 指南分组 | `{collections:[{key,label,items(精简)}]}` |
| GET | /api/guide/search?q= | 公开 | 全文搜索 | `{results:[{item,col,colLabel,score,titleSegs,summarySegs}]}` |
| GET | /api/guide/:itemId | 公开 | 指南详情 | `{item(含 content)}` |
| GET | /api/favorites | Bearer | 收藏列表 | `{items[]}` |
| GET | /api/favorites/ids | Bearer | 收藏 id 集 | `{ids[]}` |
| POST | /api/favorites/:itemId | Bearer | 收藏（幂等） | `{fav:true}` |
| DELETE | /api/favorites/:itemId | Bearer | 取消收藏 | `{fav:false}` |
| GET | /api/checklist/:itemId | Bearer | 清单勾选态 | `{map, doneCount}` |
| PUT | /api/checklist/:itemId/:rowIdx | Bearer | 勾选/取消（upsert） | `{done, doneCount}` |
| GET | /api/applications | Bearer | 申请列表 | `{list[]}` |
| POST | /api/applications | Bearer | 提交（后端 schema 校验） | `{record}` |
| DELETE | /api/applications/:id | Bearer | 删除申请 | `{}` |
| DELETE | /api/user/data | Bearer | 清空交互数据 | `{}` |
| POST | /api/chat | 公开+限流 | AI 对话（SSE） | 见 §4 |

## 3. 关键请求/响应示例

### 3.1 登录

```http
POST /api/auth/captcha
→ {"code":0,"data":{"captchaId":"cap_...","image":"data:image/png;base64,..."}}

POST /api/auth/login
{"studentNo":"2026010001","password":"123456","captchaId":"cap_...","captchaCode":"1234"}
→ {"code":0,"data":{"token":"<64hex>","student":{"studentNo":"2026010001","name":"王小明","major":"计算机科学与技术","className":"计科2601","grade":2026}}}
```

### 3.2 成绩（含统计）

```http
GET /api/edu/grades?semester=2025-2026-1  (Authorization: Bearer ...)
→ {"code":0,"data":{
  "semesters":["2025-2026-2","2025-2026-1"],
  "semester":"2025-2026-1",
  "grades":[
    {"courseName":"高等数学（上）","credit":5,"score":52,"gpaPoints":1.5,"isResit":true,"resitScore":66},
    ...
  ],
  "stats":{"totalCredits":23,"weightedGpa":3.03,"avgScore":80.43}
}}
```

### 3.3 搜索（高亮分段）

```http
GET /api/guide/search?q=报到
→ {"code":0,"data":{"results":[{
  "item":{"id":"must-list","title":"必备清单",...},
  "col":"guide","colLabel":"入学指南","score":2,
  "titleSegs":[{"t":"必备清单","hl":false}],
  "summarySegs":[{"t":"入学报到","hl":true},{"t":"随身要带的东西","hl":false}]
}]}}
```

## 4. AI 对话 SSE 协议

预检错误（发生流开始前）升级为 HTTP 状态码 + 统一信封；流开始后的帧协议：

```
data: {"t":"d","c":"回答增量"}
data: {"t":"end"}
data: {"t":"err","code":"AI_ERROR|TIMEOUT","message":"..."}   （可选，随后必跟 end）
```

- 护栏/限流/空消息 → `400/40001`、`429/42901`（普通 JSON 信封）
- 无 Coze 凭据 → 本地 KB/指南搜索兜底，仍以 SSE 帧输出（前端无差别渲染）
- 45 秒无新 chunk → 看门狗中止，输出 `{"t":"err","code":"TIMEOUT"}` + `{"t":"end"}`

## 5. 分页约定

- `/api/news?category=&page=1&pageSize=10`：置顶优先（`ORDER BY is_top DESC, published_at DESC`），`hasMore` 由 `offset + len < total` 计算。
- LIMIT/OFFSET 参数经 `parseInt` 强转为安全整数后内插（mysql2 预编译对 LIMIT 绑定字符串不兼容，见代码注释）。
