// src/utils/captcha.js —— 图形验证码（零依赖手写 PNG 编码，论文关键算法素材）
// 方案：4 位数字按 5×7 点阵字体放大绘制 → 随机偏移/颜色/干扰线/噪点 →
//       逐行 filter byte 0 + zlib.deflateSync 压缩成 IDAT → 手写 CRC32 拼 PNG 头/IHDR/IEND
// 状态机（内存 Map）：3 分钟过期 / 校验成功即删（一次性）/ 同 id 错 5 次作废
const crypto = require("crypto");
const zlib = require("zlib");

// ---------- CRC32（查表，PNG 块校验用） ----------
const CRC_TABLE = (function () {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---------- PNG 编码 ----------
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// raw 为 RGBA 行数据，转 8bit RGB 并加 filter byte 后压缩
function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = row + 1 + x * 3;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// ---------- 5×7 点阵数字（每字符 7 行 × 5 列，"1"=前景） ----------
const GLYPHS = [
  [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110], // 0
  [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110], // 1
  [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111], // 2
  [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110], // 3
  [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010], // 4
  [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110], // 5
  [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110], // 6
  [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000], // 7
  [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110], // 8
  [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100]  // 9
];

const W = 120;
const H = 40;
const CELL = 4; // 点阵单元像素

function randInt(min, max) {
  return min + crypto.randomInt(0, max - min + 1);
}

// 绘制一张验证码图，返回 { code, pngBase64 }
function drawCaptcha(code) {
  const img = new Uint8Array(W * H * 4);

  // 背景（暖色系 #FDF8F3）
  for (let i = 0; i < W * H; i++) {
    img[i * 4] = 0xfd;
    img[i * 4 + 1] = 0xf8;
    img[i * 4 + 2] = 0xf3;
    img[i * 4 + 3] = 255;
  }

  const setPx = (x, y, r, g, b) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 4;
    img[i] = r;
    img[i + 1] = g;
    img[i + 2] = b;
  };

  // 干扰线
  const lineCount = randInt(2, 3);
  for (let l = 0; l < lineCount; l++) {
    const lc = randInt(150, 200);
    const x0 = randInt(0, W / 2);
    const y0 = randInt(0, H);
    const x1 = randInt(W / 2, W);
    const y1 = randInt(0, H);
    const steps = 40;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      setPx(x, y, lc, lc, lc);
    }
  }

  // 数字（每个随机纵向偏移 + 随机深色）
  for (let i = 0; i < code.length; i++) {
    const glyph = GLYPHS[Number(code[i])];
    const ox = 8 + i * 28;
    const oy = 4 + randInt(0, 8);
    const fg = randInt(60, 130);
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (!((glyph[row] >> (4 - col)) & 1)) continue;
        const px = ox + col * CELL;
        const py = oy + row * CELL;
        for (let dy = 0; dy < CELL; dy++) {
          for (let dx = 0; dx < CELL; dx++) {
            setPx(px + dx, py + dy, fg, fg, fg);
          }
        }
      }
    }
  }

  // 噪点
  const noiseCount = 40;
  for (let n = 0; n < noiseCount; n++) {
    const nc = randInt(120, 220);
    setPx(randInt(0, W - 1), randInt(0, H - 1), nc, nc, nc);
  }

  return encodePng(W, H, img).toString("base64");
}

// ---------- 状态机 ----------
const TTL_MS = 3 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const captchas = new Map(); // captchaId -> { code, expiresAt, attempts }

function makeCaptcha() {
  const code = Array.from({ length: 4 }, () => String(crypto.randomInt(0, 10))).join("");
  const captchaId = "cap_" + crypto.randomBytes(8).toString("hex");
  captchas.set(captchaId, { code: code, expiresAt: Date.now() + TTL_MS, attempts: 0 });
  return { captchaId: captchaId, code: code, image: "data:image/png;base64," + drawCaptcha(code) };
}

// 校验：成功即删（一次性）；过期/错满 5 次删除作废；输入错误 attempts+1
function verifyCaptcha(captchaId, input) {
  const c = captchas.get(captchaId);
  if (!c) return false;
  if (Date.now() > c.expiresAt || c.attempts >= MAX_ATTEMPTS) {
    captchas.delete(captchaId);
    return false;
  }
  if (String(input || "") === c.code) {
    captchas.delete(captchaId);
    return true;
  }
  c.attempts += 1;
  return false;
}

// 每 10 分钟清理过期（不阻塞进程退出）
setInterval(() => {
  const now = Date.now();
  captchas.forEach((c, id) => {
    if (now > c.expiresAt) captchas.delete(id);
  });
}, 10 * 60 * 1000).unref();

module.exports = { makeCaptcha: makeCaptcha, verifyCaptcha: verifyCaptcha };
