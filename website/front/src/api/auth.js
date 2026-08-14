// api/auth.js —— 认证接口
import request from "../utils/request.js";

export const authApi = {
  captcha: () => request.post("/auth/captcha"),
  login: (data) => request.post("/auth/login", data),
  logout: () => request.post("/auth/logout"),
  me: () => request.get("/auth/me")
};
