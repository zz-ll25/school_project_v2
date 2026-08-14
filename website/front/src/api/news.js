// api/news.js —— 校园资讯接口
import request from "../utils/request.js";

export const newsApi = {
  list: (params) => request.get("/news", { params }),
  detail: (id) => request.get("/news/" + id)
};
