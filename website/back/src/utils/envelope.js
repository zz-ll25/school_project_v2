// src/utils/envelope.js —— 统一响应信封 { code, message, data }
// code: 0 成功 / 40001 参数 / 40101 未登录 / 40102 密码错 / 40103 验证码错 / 40401 不存在 / 42901 限流 / 50000 内部错误
function ok(res, data, message) {
  res.json({ code: 0, message: message || "ok", data: data === undefined ? {} : data });
}

function fail(res, httpStatus, code, message) {
  res.status(httpStatus).json({ code: code, message: message });
}

module.exports = { ok: ok, fail: fail };
