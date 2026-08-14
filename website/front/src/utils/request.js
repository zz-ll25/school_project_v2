// utils/request.js —— axios 封装：token 注入、信封解包、401 跳登录、错误提示
import axios from "axios";
import { ElMessage } from "element-plus";
import router from "../router/index.js";
import { useAuthStore } from "../stores/auth.js";

const instance = axios.create({
  baseURL: "/api",
  timeout: 15000
});

// 请求拦截：注入 Bearer token
instance.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) config.headers.Authorization = "Bearer " + auth.token;
  return config;
});

// 响应拦截：解统一信封 { code, message, data }
instance.interceptors.response.use(
  (res) => {
    const d = res.data;
    if (d && d.code === 0) return d.data;
    if (d && d.code === 40101) {
      const auth = useAuthStore();
      auth.logout();
      if (router.currentRoute.value.path !== "/login") {
        router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
      }
      ElMessage.error(d.message || "登录已失效，请重新登录");
    } else if (d && d.code) {
      ElMessage.error(d.message || "请求失败");
    }
    return Promise.reject(Object.assign(new Error(d ? d.message : "请求失败"), { code: d && d.code }));
  },
  (err) => {
    const code = (err.response && err.response.data && err.response.data.code) || "NETWORK";
    const message = (err.response && err.response.data && err.response.data.message) || "无法连接服务器";
    if (code === 40101) {
      const auth = useAuthStore();
      auth.logout();
      if (router.currentRoute.value.path !== "/login") {
        router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
      }
    }
    ElMessage.error(message);
    return Promise.reject(Object.assign(new Error(message), { code: code }));
  }
);

export default instance;
