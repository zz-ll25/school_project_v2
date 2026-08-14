// api/user.js —— 收藏 / 清单 / 申请接口
import request from "../utils/request.js";

export const favApi = {
  list: () => request.get("/favorites"),
  ids: () => request.get("/favorites/ids"),
  add: (itemId) => request.post("/favorites/" + encodeURIComponent(itemId)),
  remove: (itemId) => request.delete("/favorites/" + encodeURIComponent(itemId))
};

export const ckApi = {
  get: (itemId) => request.get("/checklist/" + encodeURIComponent(itemId)),
  put: (itemId, rowIdx, done) => request.put("/checklist/" + encodeURIComponent(itemId) + "/" + rowIdx, { done })
};

export const appApi = {
  list: () => request.get("/applications"),
  submit: (data) => request.post("/applications", data),
  remove: (id) => request.delete("/applications/" + encodeURIComponent(id)),
  clearData: () => request.delete("/user/data")
};
