# 电子科技大学成都学院 · 新生导航小程序 v2

> **网站版（毕业设计）**：已独立为单独仓库 —— 教务系统 + 新生导航网站（Vue 3 + Express + MySQL），见 [github.com/zz-ll25/school_web](https://github.com/zz-ll25/school_web)。

面向 2026 级新生的入学导航微信小程序（原生开发，零依赖、零图片资源）。从 v1 重构而来，补齐了搜索、收藏、清单持久化、分享、校区地图、表单校验与 AI 流式对话。

> ⚠️ **演示项目声明**：本应用内全部数据（电话、链接、地址坐标、套餐等）均为示例内容，界面中带「示例」徽章的条目为演示数据，请以学校官方通知为准。

## 目录结构

```
├── data\          # 唯一数据源（小程序与 server 共用，纯函数可 node 测试）
├── store\         # 本地存储封装（storage 前缀 cduestc:，带版本守卫）
├── utils\         # url 拨号/复制/地图、统一跳转、分享、流式聊天客户端
├── pages\         # index / search / detail / favorites / applications / assistant / mine
├── components\    # banner / grid-menu / entry-icon / campus-card / empty-state / demo-badge
├── custom-tab-bar\
└── server\        # Coze 对话中转（SSE 流式，可选，前端无后端也能演示）
```

## 快速开始

1. 微信开发者工具 → 导入项目 → 选择本目录（appid：`wxbb43069e31d90bd1`，或使用自己的测试 appid）。
2. 直接编译即可体验全部功能（无后端）：搜索、收藏、清单勾选、表单申请均存本地；AI 助手走本地知识库兜底。

### 启用 AI 真连（可选）

```bash
cd server
cp .env.example .env   # 填入 COZE_PAT / COZE_BOT_ID
node coze-relay.js     # 零依赖，Node 18+，监听 3000
```

然后在微信开发者工具勾选「不校验合法域名」，并修改 `utils/chat.js` 顶部 `RELAY_BASE` 为你的中转地址（真机需 HTTPS 合法域名）。

## 存储 Key

| Key | 说明 |
|---|---|
| `cduestc:user` | 每设备会话 sid |
| `cduestc:favorites` | 收藏条目 id 列表 |
| `cduestc:checklist` | 清单勾选状态 |
| `cduestc:applications` | 表单申请记录 |
| `cduestc:chatlog` | AI 对话记录（上限 100 条） |

## 自测清单（DevTools）

| 功能 | 操作 | 预期 |
|---|---|---|
| 首页 | 打开首页 | 四区块齐全；「{{guide.length}} 项入学指南」由数据计算 |
| 详情 | 逐一点开 list/article/notice/link/form 各一个 | 五类型正确渲染；link/form 显示「示例」徽章 |
| 清单持久化 | 勾选 2 项 → 重新编译 | 勾选保留（`cduestc:checklist` 有值），进度条更新 |
| 收藏 | 详情页点 ⭐ → 我的收藏 | 列表出现；取消后即时消失；「我的」角标同步 |
| 表单 | 空提交 / 错手机号 / 合法提交 | 行内红字 / 红字 / 弹窗成功 →「我的申请」可见记录 |
| 搜索 | 输入「报到」；再输「报到 宿舍」；乱码 | 高亮结果；AND 收窄；空态提示 |
| 地图 | 首页/我的页点校区卡 | 打开微信地图定位校区 |
| 助手（离线） | server 不启动，chips 提问 | 打字机出本地 KB 答案；「停止」生效；清空后 `cduestc:user` sid 变化 |
| 助手（在线） | 启动 server 勾选「不校验合法域名」 | 流式追加；连发触发 429 友好文案；问「四川大学」得护栏文案 |
| 设置 | 我的 → 设置 → 清空本地数据 | 收藏/清单/申请/对话全部复位、角标归零 |
| 边界 | Storage 写入坏值（如 `cduestc:favorites="###"`） | 页面不崩，回默认值自愈 |

Server 验证见 `server/README.md` 的 curl 套件。
