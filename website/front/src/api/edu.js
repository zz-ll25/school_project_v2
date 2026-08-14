// api/edu.js —— 教务接口
import request from "../utils/request.js";

export const eduApi = {
  student: () => request.get("/edu/student"),
  schedule: (semester) => request.get("/edu/schedule", { params: semester ? { semester } : {} }),
  grades: (semester) => request.get("/edu/grades", { params: semester ? { semester } : {} }),
  exams: () => request.get("/edu/exams")
};
