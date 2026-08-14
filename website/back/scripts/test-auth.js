// scripts/test-auth.js —— 认证接口 curl 套件（Node 版，P7 论文测试用例素材）
// 前置：DEBUG_CAPTCHA=1 node src/app.js 已启动（8000 端口）
const BASE = "http://localhost:8000/api";

// 测试用伪造 XFF 模拟不同客户端 IP：合法绕过 IP 维度限流（5 次/分钟），
// 学号维度限流仍按真实 studentNo 生效，可反复回归。
let fakeIpSeq = 0;
function fakeHeaders(token, extra) {
  const h = { ...(token ? { Authorization: "Bearer " + token } : {}) };
  if (extra && extra.fakeIp) h["x-forwarded-for"] = "10.99." + (fakeIpSeq++ % 250) + "." + (fakeIpSeq % 250);
  return h;
}

async function post(path, body, opts) {
  const o = opts || {};
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...fakeHeaders(o.token, o) },
    body: JSON.stringify(body || {})
  });
  return { status: res.status, json: await res.json() };
}

async function get(path, token) {
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: "Bearer " + token } : {}
  });
  return { status: res.status, json: await res.json() };
}

let pass = 0, failN = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS", name); }
  else { failN++; console.log("  FAIL", name, detail || ""); }
}

async function main() {
  // 1. 获取验证码（DEBUG 模式带明文 code）
  const cap = await post("/auth/captcha");
  check("获取验证码", cap.status === 200 && cap.json.code === 0 && cap.json.data.image.indexOf("data:image/png") === 0);

  // 2. 登录正例
  const login = await post("/auth/login", {
    studentNo: "2026010001", password: "123456",
    captchaId: cap.json.data.captchaId, captchaCode: cap.json.data.code
  }, { fakeIp: true });
  check("登录成功", login.status === 200 && login.json.code === 0 && login.json.data.token.length === 64,
    JSON.stringify(login.json).slice(0, 120));
  const token = login.json.data.token;

  // 3. me 带 token
  const me = await get("/auth/me", token);
  check("me 返回学生信息", me.status === 200 && me.json.data.name === "王小明");

  // 4. 无 token 访问 → 40101
  const meNoToken = await get("/auth/me");
  check("无 token → 40101", meNoToken.status === 401 && meNoToken.json.code === 40101);

  // 5. 伪造 token → 40101
  const meFake = await get("/auth/me", "f".repeat(64));
  check("伪造 token → 40101", meFake.status === 401 && meFake.json.code === 40101);

  // 6. 错密码 → 40102（验证码被消耗）
  const cap2 = await post("/auth/captcha");
  const badPwd = await post("/auth/login", {
    studentNo: "2026010001", password: "wrong",
    captchaId: cap2.json.data.captchaId, captchaCode: cap2.json.data.code
  }, { fakeIp: true });
  check("错密码 → 40102", badPwd.status === 401 && badPwd.json.code === 40102);

  // 7. 复用已消耗验证码 → 40103
  const reuse = await post("/auth/login", {
    studentNo: "2026010001", password: "123456",
    captchaId: cap2.json.data.captchaId, captchaCode: cap2.json.data.code
  }, { fakeIp: true });
  check("复用验证码 → 40103", reuse.status === 401 && reuse.json.code === 40103);

  // 8. 验证码错 5 次作废（状态机单元级验证，避免消耗登录限流配额）
  const captchaMod = require("../src/utils/captcha");
  const cap3 = captchaMod.makeCaptcha();
  let wrongOk = true;
  for (let i = 0; i < 5; i++) {
    if (captchaMod.verifyCaptcha(cap3.captchaId, "0000") !== false) wrongOk = false;
  }
  // 第 6 次即使输入正确也已作废
  const dead = captchaMod.verifyCaptcha(cap3.captchaId, cap3.code);
  check("验证码错 5 次作废", wrongOk && dead === false);
  // 一次性：正确校验后立即失效
  const cap4 = captchaMod.makeCaptcha();
  const once = captchaMod.verifyCaptcha(cap4.captchaId, cap4.code);
  const twice = captchaMod.verifyCaptcha(cap4.captchaId, cap4.code);
  check("验证码一次性有效", once === true && twice === false);

  // 9. 登出后 token 失效
  const logout = await post("/auth/logout", {}, { token: token });
  const meAfter = await get("/auth/me", token);
  check("登出后 token 失效", logout.json.code === 0 && meAfter.status === 401 && meAfter.json.code === 40101);

  console.log("\n==> 认证测试:", pass, "通过 /", failN, "失败");
  if (failN > 0) process.exit(1);
}

main().catch((e) => { console.error("test-auth failed:", e); process.exit(1); });
