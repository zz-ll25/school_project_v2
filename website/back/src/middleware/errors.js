// src/middleware/errors.js —— 404 与全局错误兜底（统一信封）
const { fail } = require("../utils/envelope");

function notFound(req, res) {
  fail(res, 404, 40401, "接口不存在");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[500]", err);
  fail(res, 500, 50000, "服务端内部错误");
}

module.exports = { notFound: notFound, errorHandler: errorHandler };
