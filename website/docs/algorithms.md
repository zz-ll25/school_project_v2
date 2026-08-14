# 关键算法（论文素材）

## 1. GPA 加权计算（成绩统计）

采用国内高校通用的 4.0 分段绩点制：

```
单科绩点 gpa(score)：
  ≥90 → 4.0；≥85 → 3.7；≥82 → 3.3；≥78 → 3.0；≥75 → 2.7
  ≥72 → 2.3；≥68 → 2.0；≥64 → 1.5；≥60 → 1.0；<60 → 0

加权平均绩点 = Σ(gpa_i × credit_i) / Σ(credit_i)     （仅计及格课程）
加权平均分   = Σ(score_i × credit_i) / Σ(credit_i)    （补考课程按补考成绩）
```

- 补考成绩以 `resit_score` 覆盖原始分；gpa_points 在成绩入库时按最终分计算并冗余存储（`GRADES.gpa_points`），查询时聚合即可，避免重复计算。
- 实测校验：李小红 2025-2026-1 共 9 门，及格 8 门（学分 23），weightedGpa=3.03、avgScore=80.43，与手算一致（见 docs/test-cases.md D-01）。

## 2. 全文搜索打分与高亮（指南搜索）

数据规模 22 条，采用**全量内存索引 + 自研打分**（MySQL FULLTEXT 中文需 ngram 解析器且无法实现按字段加权）：

1. **haystack 构建**：标题 + 摘要 + keywords + 五类型内容拍平（list 拼接 text、article 拼接标题段与正文段……）统一小写。
2. **多词 AND 匹配**：所有 term 均命中 haystack 才入选（空格分词）。
3. **打分**：每个 term——标题命中 +3、摘要/keywords 命中 +2、正文命中 +1；总分降序（同分保持数据原序的稳定排序）。
4. **高亮分段** `segments(text, terms)`：对每个 term 在文本中大小写不敏感地标记所有命中区间（掩码数组，重叠合并），扫描生成 `[{t, hl}]` 分段序列，前端按 hl 布尔值着色渲染。
5. **摘要窗口** `summarySegs`：取首个命中位置 ±12 字，两端补省略号，再走同一分段流程——搜索结果列表无需加载全文即可展示命中上下文。

复杂度：设条目数 n=22、平均文本长 m、term 数 k，单次搜索 O(n·k·m)，毫秒级。

## 3. 令牌桶限流

经典令牌桶：每个 key 维护 `{tokens, ts}`：

```
take(key, capacity, refillMs):
  tokens = min(capacity, tokens + (now - ts) / refillMs)   // 匀速补充
  ts = now
  if tokens < 1: return false                              // 拒绝
  tokens -= 1; return true
```

- 特点：允许瞬时突发（桶容量），长期速率受控（补充速率）；内存 Map 实现，10 分钟无活动自动清理（`setInterval().unref()` 不阻塞进程退出）。
- 参数：登录 IP 5 枚/分钟、登录学号 5 枚/15 分钟；AI 对话 IP 30 枚（1/秒）、会话 20 枚（1/30 秒）。
- 对比固定窗口：令牌桶无临界突刺问题（窗口边界双倍流量）。

## 4. 手写 PNG 验证码编码（零依赖）

**约束**：浏览器/前端展示最通用的图片形态是 PNG；不引入任何图像库，用 Node 内置 zlib 手工构造 PNG 文件。

```
1. 绘制：120×40 RGBA 像素缓冲
   - 4 位数字按 5×7 点阵字模（10 个 GLYPHS 常量）放大绘制，CELL=4 像素
   - 每数字随机纵向偏移(0~8) + 随机深色(60~130)，破坏整齐基线
   - 叠加 2~3 条随机干扰线（线性插值步进）+ 40 个随机噪点
   - 暖色背景 #FDF8F3 与全站视觉一致
2. 编码（PNG 规范）：
   - signature（8B 固定魔数）
   - IHDR：宽/高/8bit/RGB(色型 2)/无压缩/无滤波/无隔行
   - 原始数据：每扫描行前置 filter byte 0（None），RGB 交错
   - IDAT：zlib.deflateSync(raw, level 9)
   - 每块：len(BE) + type + data + CRC32(type||data)（查表 CRC，多项式 0xEDB88320）
   - IEND 空块收尾
3. 输出 data:image/png;base64 前缀的数据 URI，前端 <img :src> 直接渲染
```

验证方式：解压 IDAT 校验字节数 = 40×(1+120×3)，filter 全 0；浏览器端渲染实测通过。

## 5. 课表网格定位算法（前端）

自写 flex 定位网格（不用表格组件——表格单元格无法表达跨节连堂与合并卡）：

```
容器：左时间轴列(56px) + 7 个星期列(flex 均分)
节次行高 SLOT_H = 56px；12 节 → 时间轴标注 12 行（第 2/4/6/8/10/12 节下加粗分隔线，对应六讲）

课程卡（绝对定位）：
  top    = (startSection - 1) × SLOT_H + 2
  height = (endSection - startSection + 1) × SLOT_H - 4
  left/right = 所在星期列内 3px 边距
  颜色   = 8 色板[courseId % 8]（同课程一周多节同色；浅底深字与主题协调）

周次过滤：第 w 周仅渲染 startWeek ≤ w ≤ endWeek 的课程
  默认当前周 = clamp((今天 - 学期开学日) / 7天 + 1, 1, 20)，开学前取第 1 周
```

## 6. SSE 流式协议与三级降级（AI 对话）

服务端归一化帧协议（移植自原小程序中转服务，保持一致性）：

```
data: {"t":"d","c":"回答增量"}     // 增量追加
data: {"t":"end"}                   // 结束
data: {"t":"err","code":"...","message":"..."}   // 流内错误（后随 end）
```

**三级降级链**（保证答辩演示可用性）：

| 级 | 条件 | 行为 |
|---|---|---|
| 1 | Coze 凭据已配置 | 真流式：上游 SSE 逐 chunk 解析（event: conversation.message.delta），45s 无新 chunk 看门狗中止 |
| 2 | 无凭据 / AI 异常 | 本地 KB 关键词命中 → 指南条目全文搜索 → 引导文案（数据源为 MySQL guide_items，与页面零漂移） |
| 3 | 护栏/限流 | 预检拦截为 HTTP 400/429 信封，前端直接渲染文案 |

浏览器端用 fetch + ReadableStream 逐行解析（EventSource 不支持 POST），AbortController 实现"停止生成"；客户端断连经 `req.on("close")` 联动中止上游，防资源泄漏。
