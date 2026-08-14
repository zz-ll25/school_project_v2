# 成电校园门户（毕业设计网站版）

面向新生与在校生的校园综合服务网站：**教务系统（学号+密码+验证码登录、课表、成绩 GPA、考试安排）+ 新生导航（指南/搜索/收藏/清单/表单申请）+ 校园资讯 + AI 流式对话**。

技术栈：Vue 3 + Vite + Element Plus / Express 5 + MySQL 8。前后端分离，AI 对话 SSE 流式，无 Coze 凭据也可完整演示（本地知识库兜底）。

> ⚠️ 演示项目声明：全部数据（账号/成绩/资讯/电话等）均为示例内容，请以学校官方信息为准。

## 目录结构

```
website/
├── back/            # Express + MySQL 后端（端口 8000）
│   ├── db/schema.sql      # 11 张表 DDL
│   ├── scripts/db-init.js # 一键初始化（建库+DDL+种子，幂等可重跑）
│   ├── scripts/gen-seed.js# 种子数据（指南 22 条自动导入自 ../data/）
│   ├── scripts/test-auth.js # 认证 curl 套件
│   └── src/  app.js / routes/ / services/ / middleware/ / utils/ / db/
├── front/           # Vue 3 前端（端口 5173，proxy /api → 8000）
│   ├── *_flow_test.py     # Playwright 端到端测试（6 套）
│   └── src/  views/ components/ stores/ api/ utils/ router/
└── docs/            # 论文素材 7 篇（技术选型/架构/E-R/API/安全/测试用例/关键算法）
```

## 快速开始

### 1. 数据库（MySQL 8，root/123456 按需修改 back/.env）

```bash
cd website/back
cp .env.example .env        # 修改 DB_PASSWORD 为你的 MySQL 密码
npm install
npm run db:init             # 建库 school_web + 种子数据（幂等，可随时重跑复位）
```

### 2. 后端（8000）

```bash
npm start                   # 或 npm run dev（node --watch 热重启）
```

### 3. 前端（5173）

```bash
cd ../front
npm install
npm run dev
```

浏览器打开 http://localhost:5173 。开发期无需关心 CORS（Vite proxy 同源转发）。

## 演示账号

| 学号 | 密码 | 姓名 | 演示点 |
|---|---|---|---|
| 2026010001 | 123456 | 王小明（2026级 计科） | 课表 10 时段（含短周课程，切周演示过滤）+ 6 场考试（倒计时为正）+ 成绩空态（新生未出分） |
| 2025010001 | 123456 | 李小红（2025级 软工） | 两学期 17 条成绩（高数 52 分→补考 66 分）+ 加权 GPA 统计 + 8 场考试 |

## AI 助手（可选配置）

`.env` 留空 `COZE_PAT/COZE_BOT_ID` 时走本地知识库兜底（答辩无需凭据）；配置后走 Coze 真流式：

```bash
COZE_PAT=你的pat
COZE_BOT_ID=你的bot_id
```

## 测试

```bash
# 后端认证套件（需 DEBUG_CAPTCHA=1 启动后端）
cd back && node scripts/test-auth.js

# 浏览器端到端（需前后端运行中 + pip install playwright + playwright install chromium）
cd front && python login_flow_test.py && python guide_flow_test.py && python edu_flow_test.py && python interact_flow_test.py && python chat_flow_test.py
```

回归结果：auth 10/10 · login PASS · guide 9/9 · edu 13/13 · interact 10/10 · chat 5/5（详见 docs/test-cases.md）。

## 答辩演示脚本（建议 8 分钟版）

1. **起服务**：`back: npm start` + `front: npm run dev`，浏览器打开 5173
2. **新生导航**：首页宫格 → 指南列表 → 点「必备清单」勾选 2 项（提示登录 → 展示引导）→ 搜索「报到 宿舍」展示 AND 收窄与高亮
3. **登录**：演示账号 2026010001/123456 → 验证码点击刷新 → 登录（可先输错验证码展示红字）
4. **教务**：周课表（切第 5 周展示短周课程消失）→ 考试安排（倒计时）→ 成绩空态
5. **切换账号**：退出 → 2025010001 → 成绩 17 条 + 统计卡 + 补考标签（切换学期）
6. **资讯**：列表置顶/分类 → 详情阅读量 +1
7. **AI 助手**：chip「报到流程」（本地兜底）→ 问「四川大学」展示护栏
8. **收尾**：个人信息 → 清空数据 → 退出登录

## 环境依赖

- Node.js ≥ 18（推荐 24）
- MySQL 8.x（本机已装 8.0.43；答辩机安装官方 MSI Server-only，或自带笔记本）
- 数据库备份：`mysqldump -u root -p school_web > backup.sql`

## 已知限制

- `DEBUG_CAPTCHA=1` 仅限本地开发（验证码响应附明文，便于自动化测试），生产严禁开启。
- 真机演示需 HTTPS 合法域名；开发与演示用 localhost + DevTools 代理即可。
- 验证码/限流为内存实现，单实例部署（论文"已知边界"章节已说明）。
