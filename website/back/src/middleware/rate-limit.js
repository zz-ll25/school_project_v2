// src/middleware/rate-limit.js —— 内存令牌桶限流（移植自 server/coze-relay.js L47-72）
// 论文素材：令牌桶算法（容量 + 匀速补充），chat 与 login 各配独立桶参数
const buckets = new Map(); // key -> { tokens, ts }

function take(key, capacity, refillMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: capacity, ts: now };
    buckets.set(key, b);
  }
  b.tokens = Math.min(capacity, b.tokens + (now - b.ts) / refillMs);
  b.ts = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

// 便捷封装：容量 n 枚、每 refillMs 毫秒补 1 枚
function limiter(capacity, refillMs) {
  return function (key) {
    return take(key, capacity, refillMs);
  };
}

// 每 10 分钟清理空闲桶
setInterval(() => {
  const now = Date.now();
  buckets.forEach((b, k) => {
    if (now - b.ts > 10 * 60 * 1000) buckets.delete(k);
  });
}, 10 * 60 * 1000).unref();

module.exports = { limiter: limiter };
