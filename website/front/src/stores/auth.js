// stores/auth.js —— 登录态（token 持久化 localStorage，学生信息内存态）
import { defineStore } from "pinia";
import { authApi } from "../api/auth";

const TOKEN_KEY = "cduestc-web:token";

function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: loadToken(),
    student: null
  }),
  getters: {
    isLoggedIn: (s) => !!s.token
  },
  actions: {
    setToken(token) {
      this.token = token;
      try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
    },
    // 登录成功后写入 token 与学生信息
    applyLogin(data) {
      this.setToken(data.token);
      this.student = data.student;
    },
    // 拉取当前登录学生信息（/api/auth/me）
    async fetchMe() {
      if (!this.token) return null;
      try {
        this.student = await authApi.me();
      } catch (e) {
        if (e.code === 40101) this.logout();
      }
      return this.student;
    },
    logout() {
      this.setToken("");
      this.student = null;
    }
  }
});
