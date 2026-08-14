<template>
  <div class="login-wrap">
    <div class="ui-card login-card">
      <div class="login-brand">
        <div class="login-logo">🎓</div>
        <h2 class="login-title">电子科技大学成都学院</h2>
        <p class="login-sub">教务系统 · 学生登录</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item label="学号" prop="studentNo">
          <el-input v-model="form.studentNo" placeholder="请输入学号" maxlength="12" clearable
            :prefix-icon="User" @keyup.enter="onSubmit" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" maxlength="20"
            show-password :prefix-icon="Lock" @keyup.enter="onSubmit" />
        </el-form-item>

        <el-form-item label="验证码" prop="captchaCode">
          <div class="captcha-row">
            <el-input v-model="form.captchaCode" placeholder="4 位数字" maxlength="4" @keyup.enter="onSubmit" />
            <img class="captcha-img" :src="captchaImage" alt="验证码" title="点击刷新"
              @click="refreshCaptcha" />
          </div>
        </el-form-item>

        <el-button type="primary" class="login-btn" :loading="submitting" @click="onSubmit">
          登 录
        </el-button>
      </el-form>

      <div class="login-tip">
        <span class="demo-badge">演示账号</span>
        <div class="tip-lines">
          <p>新生：2026010001 / 123456（课表+考试，暂无成绩）</p>
          <p>在校生：2025010001 / 123456（成绩 GPA + 补考示例）</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { User, Lock } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const formRef = ref(null);
const submitting = ref(false);
const captchaImage = ref("");
const captchaId = ref("");

const form = reactive({
  studentNo: "",
  password: "",
  captchaCode: ""
});

const rules = {
  studentNo: [
    { required: true, message: "请输入学号", trigger: "blur" },
    { pattern: /^\d{6,12}$/, message: "学号为 6-12 位数字", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度 6-20 位", trigger: "blur" }
  ],
  captchaCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { pattern: /^\d{4}$/, message: "验证码为 4 位数字", trigger: "blur" }
  ]
};

async function refreshCaptcha() {
  try {
    const data = await authApi.captcha();
    captchaId.value = data.captchaId;
    captchaImage.value = data.image;
  } catch (e) {
    captchaImage.value = "";
  }
}

async function onSubmit() {
  if (submitting.value) return;
  try {
    await formRef.value.validate();
  } catch (e) {
    return;
  }
  submitting.value = true;
  try {
    const data = await authApi.login({
      studentNo: form.studentNo,
      password: form.password,
      captchaId: captchaId.value,
      captchaCode: form.captchaCode
    });
    auth.applyLogin(data);
    ElMessage.success("登录成功，欢迎 " + data.student.name);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/edu"; // P4 建立 /edu 路由
    router.replace(redirect);
  } catch (e) {
    // 验证码错误/已消耗 → 换一张；密码错误保留验证码由用户修改重试
    if (e.code === 40103) {
      form.captchaCode = "";
      refreshCaptcha();
    } else if (e.code === 40102) {
      form.captchaCode = "";
      refreshCaptcha();
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(refreshCaptcha);
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 28px;
}
.login-brand {
  text-align: center;
  margin-bottom: 24px;
}
.login-logo {
  font-size: 44px;
}
.login-title {
  margin: 8px 0 4px;
  font-size: 20px;
}
.login-sub {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}
.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
}
.captcha-img {
  width: 120px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #e6dfd7;
  cursor: pointer;
  flex-shrink: 0;
  background: #fff;
}
.login-btn {
  width: 100%;
  margin-top: 4px;
}
.login-tip {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e6dfd7;
  font-size: 12px;
  color: var(--text-sub);
}
.tip-lines p {
  margin: 6px 0 0;
}
</style>
