// src/utils/format.js —— 表单格式校验（与前端 utils/validate.js 同规则，前后端双重校验）
// 规则源自小程序 pages/detail/detail.js FORMAT_RULES
const FORMAT_RULES = {
  phone: { re: /^1[3-9]\d{9}$/, msg: "手机号格式不正确" },
  sid: { re: /^\d{6,12}$/, msg: "学号格式不正确" },
  id6: { re: /^\d{6}$/, msg: "身份证后 6 位格式不正确" },
  price: { re: /^\d+(\.\d{1,2})?$/, msg: "价格格式不正确" }
};

// 按 schema fields 校验 values，返回 { ok, errors: {key: msg} }
function validateForm(fields, values) {
  const errors = {};
  (fields || []).forEach((f) => {
    const v = values && values[f.key];
    const str = v === undefined || v === null ? "" : String(v).trim();
    if (f.required && !str) {
      errors[f.key] = "请填写" + f.label;
      return;
    }
    if (!str) return;
    if (f.maxlength && str.length > f.maxlength) {
      errors[f.key] = "最多 " + f.maxlength + " 位";
      return;
    }
    if (f.format && FORMAT_RULES[f.format]) {
      const rule = FORMAT_RULES[f.format];
      if (!rule.re.test(str)) errors[f.key] = rule.msg;
    }
  });
  return { ok: Object.keys(errors).length === 0, errors };
}

module.exports = { FORMAT_RULES: FORMAT_RULES, validateForm: validateForm };
