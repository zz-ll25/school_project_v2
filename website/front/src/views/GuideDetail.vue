<template>
  <div class="page narrow" v-if="item">
    <!-- 头部 -->
    <div class="ui-card detail-head">
      <div class="head-icon">{{ item.icon }}</div>
      <div class="head-info">
        <h1 class="head-title">
          {{ item.title }}
          <DemoBadge :show="item.demo" />
        </h1>
        <p class="head-summary">{{ item.summary }}</p>
      </div>
      <el-button v-if="item.favoritable" :type="fav ? 'warning' : 'default'" circle
        :icon="fav ? StarFilled : Star" @click="onToggleFav" title="收藏" />
    </div>

    <!-- list：清单（勾选持久化到服务端） -->
    <div v-if="item.type === 'list'" class="ui-card content-card">
      <div class="card-title">📋 清单内容</div>
      <el-checkbox v-for="(li, i) in item.content.items" :key="i" v-model="doneMap[i]"
        class="list-row" :label="i" @change="onCheck(i)">
        <span :class="{ 'done-text': doneMap[i] }">{{ li.text }}</span>
      </el-checkbox>
      <div class="list-progress">
        <el-progress :percentage="progress" :stroke-width="10" striped striped-flow />
        <span class="progress-text">{{ doneCount }}/{{ item.content.items.length }} 项已完成</span>
      </div>
    </div>

    <!-- article：图文 -->
    <div v-else-if="item.type === 'article'" class="ui-card content-card">
      <div v-for="(p, i) in item.content.paragraphs" :key="i" class="para">
        <div v-if="p.h" class="para-h">{{ p.h }}</div>
        <div class="para-p">{{ p.p }}</div>
      </div>
    </div>

    <!-- notice：公告流 -->
    <div v-else-if="item.type === 'notice'" class="ui-card content-card">
      <div v-for="(n, i) in item.content.items" :key="i" class="notice-row">
        <div class="notice-date">{{ n.date }}</div>
        <div class="notice-body">
          <div class="notice-title">{{ n.title }}</div>
          <div class="notice-text">{{ n.body }}</div>
        </div>
      </div>
    </div>

    <!-- link：外链/拨号 -->
    <div v-else-if="item.type === 'link'" class="ui-card content-card">
      <p class="link-desc">{{ item.content.desc }}</p>
      <a v-if="item.content.linkType === 'web' || item.content.linkType === 'url'"
        :href="item.content.url" target="_blank" class="link-btn-link">
        <el-button type="primary">{{ item.content.btnText || "打开链接" }}</el-button>
      </a>
      <a v-else-if="item.content.linkType === 'phone'" :href="'tel:' + item.content.tel" class="link-btn-link">
        <el-button type="primary">{{ item.content.btnText || "拨打电话" }}</el-button>
      </a>
      <div v-if="item.content.extra && item.content.extra.length" class="extra-list">
        <div class="card-title">📞 其他电话</div>
        <div v-for="(e, i) in item.content.extra" :key="i" class="extra-row">
          <span>{{ e.label }}：{{ e.tel }}</span>
          <a :href="'tel:' + e.tel" class="extra-call">拨打</a>
        </div>
      </div>
    </div>

    <!-- form：动态表单（前后端双重校验） -->
    <div v-else-if="item.type === 'form'" class="ui-card content-card">
      <p class="form-intro">{{ item.content.intro }}</p>
      <el-form label-position="top">
        <el-form-item v-for="f in item.content.fields" :key="f.key" :label="f.label"
          :error="errors[f.key]">
          <el-input v-if="f.type === 'text'" v-model="form[f.key]" :placeholder="f.placeholder"
            :maxlength="f.maxlength || 100" clearable />
          <el-input v-else-if="f.type === 'number'" v-model="form[f.key]" :placeholder="f.placeholder"
            :maxlength="f.maxlength || 20" type="number" clearable />
          <el-input v-else-if="f.type === 'textarea'" v-model="form[f.key]" type="textarea" :rows="3"
            :placeholder="f.placeholder" />
          <el-select v-else-if="f.type === 'picker'" v-model="form[f.key]" :placeholder="f.placeholder"
            style="width: 100%">
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-button type="primary" :loading="submitting" @click="onSubmit">提交申请</el-button>
      </el-form>
    </div>

    <div v-else class="ui-card content-card">未知类型</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Star, StarFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { guideApi } from "../api/guide";
import { favApi, ckApi, appApi } from "../api/user";
import { validateForm } from "../utils/validate";
import { useAuthStore } from "../stores/auth";
import DemoBadge from "../components/DemoBadge.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const item = ref(null);
const fav = ref(false);
const doneMap = reactive({});
const form = reactive({});
const errors = reactive({});
const submitting = ref(false);

const doneCount = computed(() => Object.values(doneMap).filter(Boolean).length);
const progress = computed(() => {
  const n = item.value && item.value.content.items ? item.value.content.items.length : 1;
  return Math.round((doneCount.value / n) * 100);
});

// 未登录时跳登录（携带回跳地址）
function requireLogin() {
  ElMessage.info("请先登录");
  router.push({ path: "/login", query: { redirect: route.fullPath } });
  return false;
}

// ---------- 收藏 ----------
async function onToggleFav() {
  if (!auth.isLoggedIn) return requireLogin();
  try {
    if (fav.value) {
      const d = await favApi.remove(item.value.id);
      fav.value = d.fav;
      ElMessage.success("已取消收藏");
    } else {
      const d = await favApi.add(item.value.id);
      fav.value = d.fav;
      ElMessage.success("已收藏");
    }
  } catch (e) {}
}

// ---------- 清单勾选 ----------
async function onCheck(rowIdx) {
  if (!auth.isLoggedIn) {
    // 游客点击：回滚勾选并引导登录
    doneMap[rowIdx] = !doneMap[rowIdx];
    requireLogin();
    return;
  }
  try {
    await ckApi.put(item.value.id, rowIdx, !!doneMap[rowIdx]);
  } catch (e) {
    doneMap[rowIdx] = !doneMap[rowIdx]; // 失败回滚
  }
}

// ---------- 表单提交 ----------
async function onSubmit() {
  if (!auth.isLoggedIn) return requireLogin();
  const fields = (item.value && item.value.content.fields) || [];
  const r = validateForm(fields, form);
  Object.keys(errors).forEach((k) => delete errors[k]);
  Object.assign(errors, r.errors);
  if (!r.ok) {
    ElMessage.warning("请检查表单填写");
    return;
  }
  submitting.value = true;
  try {
    await appApi.submit({ formId: item.value.id, values: { ...form } });
    ElMessage.success("提交成功，可在「我的申请」中查看");
    Object.keys(form).forEach((k) => { form[k] = ""; });
  } catch (e) {
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  const itemId = route.params.itemId;
  try {
    const d = await guideApi.detail(itemId);
    item.value = d.item;
    if (d.item.type === "form") {
      (d.item.content.fields || []).forEach((f) => { form[f.key] = ""; });
    }
    // 已登录：拉取收藏态与清单勾选态
    if (auth.isLoggedIn) {
      if (d.item.favoritable) {
        try {
          const ids = await favApi.ids();
          fav.value = (ids.ids || []).indexOf(d.item.id) >= 0;
        } catch (e) {}
      }
      if (d.item.type === "list") {
        try {
          const ck = await ckApi.get(d.item.id);
          Object.keys(ck.map || {}).forEach((k) => { doneMap[k] = ck.map[k]; });
        } catch (e) {}
      }
    }
  } catch (e) {
    if (e.code === 40401) {
      ElMessage.error("内容不存在");
      router.replace("/guide");
    }
  }
});
</script>

<style scoped>
.narrow {
  max-width: 860px;
}
.detail-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
}
.head-icon {
  font-size: 40px;
}
.head-info {
  flex: 1;
}
.head-title {
  margin: 0;
  font-size: 22px;
}
.head-summary {
  margin: 6px 0 0;
  color: var(--text-sub);
}
.content-card {
  margin-top: 16px;
}
.card-title {
  font-weight: 600;
  margin-bottom: 12px;
}
.list-row {
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  height: auto;
  align-items: flex-start;
}
.done-text {
  text-decoration: line-through;
  color: var(--text-sub);
}
.list-progress {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-text {
  font-size: 13px;
  color: var(--text-sub);
  white-space: nowrap;
}
.para {
  margin-bottom: 16px;
}
.para-h {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
}
.para-p {
  color: #5a5047;
  line-height: 1.7;
}
.notice-row {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px dashed #f0e8de;
}
.notice-row:last-child {
  border-bottom: none;
}
.notice-date {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 600;
  white-space: nowrap;
}
.notice-title {
  font-weight: 600;
}
.notice-text {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
.link-desc {
  margin: 0 0 16px;
  color: #5a5047;
}
.link-btn-link {
  text-decoration: none;
}
.extra-list {
  margin-top: 20px;
}
.extra-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #f0e8de;
  font-size: 14px;
}
.extra-call {
  color: var(--el-color-primary);
  text-decoration: none;
}
.form-intro {
  color: var(--text-sub);
  margin: 0 0 16px;
}
</style>
