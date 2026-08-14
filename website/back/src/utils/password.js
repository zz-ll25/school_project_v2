// src/utils/password.js —— scrypt 密码哈希（零依赖，OWASP 推荐 KDF）
// 存储格式：scrypt$N$r$p$<salt hex>$<hash hex>（参数随哈希存储，便于升级）
const crypto = require("crypto");

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, KEYLEN, { N: N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("hex"), hash.toString("hex")].join("$");
}

// 校验：timingSafeEqual 防时序攻击；格式异常一律返回 false
function verifyPassword(password, stored) {
  try {
    const parts = String(stored || "").split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[4], "hex");
    const expect = Buffer.from(parts[5], "hex");
    const actual = crypto.scryptSync(String(password), salt, expect.length, {
      N: Number(parts[1]),
      r: Number(parts[2]),
      p: Number(parts[3])
    });
    return crypto.timingSafeEqual(actual, expect);
  } catch (e) {
    return false;
  }
}

module.exports = { hashPassword: hashPassword, verifyPassword: verifyPassword };
