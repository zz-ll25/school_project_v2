// api/guide.js —— 新生导航接口
import request from "../utils/request.js";

export const guideApi = {
  school: () => request.get("/school"),
  collections: () => request.get("/guide/collections"),
  detail: (itemId) => request.get("/guide/" + encodeURIComponent(itemId)),
  search: (q) => request.get("/guide/search", { params: { q } })
};
