-- db/schema.sql —— 纯 DDL（由 scripts/db-init.js 在建库后以 multipleStatements 执行）
-- 注意：本文件不使用 DELIMITER / 存储过程；字符集 utf8mb4（icon 列存 emoji）

-- 学生（演示账号密码均为 123456，scrypt 哈希由种子脚本运行时计算）
CREATE TABLE IF NOT EXISTS students (
  student_no    CHAR(12)     PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  major         VARCHAR(50)  NOT NULL,
  class_name    VARCHAR(50)  NOT NULL,
  grade         SMALLINT     NOT NULL COMMENT '入学年份',
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话 token（服务端登录态；滑动续期看 expires_at/last_used_at）
CREATE TABLE IF NOT EXISTS sessions (
  token        CHAR(64)    PRIMARY KEY,
  student_no   CHAR(12)    NOT NULL,
  created_at   DATETIME    NOT NULL,
  expires_at   DATETIME    NOT NULL,
  last_used_at DATETIME    NOT NULL,
  KEY idx_sessions_student (student_no),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_student FOREIGN KEY (student_no) REFERENCES students (student_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 课程目录
CREATE TABLE IF NOT EXISTS courses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  credit      DECIMAL(3,1) NOT NULL,
  hours       INT          NOT NULL,
  teacher     VARCHAR(50)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 选课（= 课表：一行一个上课时段，同一课程可多时段多行）
CREATE TABLE IF NOT EXISTS course_selections (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  student_no    CHAR(12)    NOT NULL,
  course_id     INT         NOT NULL,
  semester      VARCHAR(20) NOT NULL,
  week_day      TINYINT     NOT NULL COMMENT '1=周一..7=周日',
  start_section TINYINT     NOT NULL,
  end_section   TINYINT     NOT NULL,
  start_week    TINYINT     NOT NULL,
  end_week      TINYINT     NOT NULL,
  location      VARCHAR(50) NOT NULL,
  UNIQUE KEY uk_sel (student_no, course_id, semester, week_day, start_section),
  KEY idx_sel_student (student_no),
  CONSTRAINT fk_sel_student FOREIGN KEY (student_no) REFERENCES students (student_no),
  CONSTRAINT fk_sel_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 成绩（补考不插第二行：is_resit 标记 + resit_score 存补考成绩）
CREATE TABLE IF NOT EXISTS grades (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_no  CHAR(12)    NOT NULL,
  course_id   INT         NOT NULL,
  semester    VARCHAR(20) NOT NULL,
  score       DECIMAL(4,1) NOT NULL,
  credit      DECIMAL(3,1) NOT NULL COMMENT '学分快照',
  gpa_points  DECIMAL(3,1) NOT NULL COMMENT '单科绩点（4.0 分段制）',
  is_resit    TINYINT     NOT NULL DEFAULT 0,
  resit_score DECIMAL(4,1) NULL,
  UNIQUE KEY uk_grade (student_no, course_id, semester),
  KEY idx_grades_student_sem (student_no, semester),
  CONSTRAINT fk_grades_student FOREIGN KEY (student_no) REFERENCES students (student_no),
  CONSTRAINT fk_grades_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 考试安排
CREATE TABLE IF NOT EXISTS exams (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT         NOT NULL,
  student_no CHAR(12)   NOT NULL,
  name      VARCHAR(100) NOT NULL,
  exam_date DATETIME    NOT NULL,
  location  VARCHAR(50) NOT NULL,
  seat_no   VARCHAR(10) NOT NULL,
  semester  VARCHAR(20) NOT NULL,
  KEY idx_exams_student (student_no),
  KEY idx_exams_date (exam_date),
  CONSTRAINT fk_exams_student FOREIGN KEY (student_no) REFERENCES students (student_no),
  CONSTRAINT fk_exams_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 官网资讯（content 为结构化段落 JSON，无 HTML 即无 XSS；source_url 预留抓取）
CREATE TABLE IF NOT EXISTS news (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  category     VARCHAR(20)  NOT NULL,
  summary      VARCHAR(500) NOT NULL,
  content      JSON         NOT NULL,
  is_top       TINYINT      NOT NULL DEFAULT 0,
  views        INT          NOT NULL DEFAULT 0,
  source_url   VARCHAR(500) NULL,
  published_at DATETIME     NOT NULL,
  KEY idx_news_cat_pub (category, published_at),
  KEY idx_news_top (is_top)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 新生导航条目（item_id 沿用 data/ 原 id，收藏/清单/申请稳定关联）
CREATE TABLE IF NOT EXISTS guide_items (
  item_id             VARCHAR(50)  PRIMARY KEY,
  title               VARCHAR(100) NOT NULL,
  icon                VARCHAR(16)  NOT NULL,
  type                VARCHAR(10)  NOT NULL COMMENT 'list/article/notice/link/form',
  category            VARCHAR(20)  NOT NULL COMMENT 'guide/services/tour',
  summary             VARCHAR(300) NOT NULL,
  keywords            JSON         NOT NULL,
  content             JSON         NOT NULL,
  favoritable         TINYINT      NOT NULL DEFAULT 1,
  demo                TINYINT      NOT NULL DEFAULT 0,
  form_schema_version INT          NULL,
  sort_order          INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏
CREATE TABLE IF NOT EXISTS favorites (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_no CHAR(12) NOT NULL,
  item_id    VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_fav (student_no, item_id),
  KEY idx_fav_student_time (student_no, created_at),
  CONSTRAINT fk_fav_student FOREIGN KEY (student_no) REFERENCES students (student_no),
  CONSTRAINT fk_fav_item FOREIGN KEY (item_id) REFERENCES guide_items (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 清单勾选（list 类型条目逐行勾选状态）
CREATE TABLE IF NOT EXISTS checklist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_no CHAR(12) NOT NULL,
  item_id    VARCHAR(50) NOT NULL,
  row_index  INT NOT NULL,
  done       TINYINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_ck (student_no, item_id, row_index),
  CONSTRAINT fk_ck_student FOREIGN KEY (student_no) REFERENCES students (student_no),
  CONSTRAINT fk_ck_item FOREIGN KEY (item_id) REFERENCES guide_items (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 表单申请记录
CREATE TABLE IF NOT EXISTS applications (
  id           VARCHAR(40)  PRIMARY KEY,
  student_no   CHAR(12)     NOT NULL,
  form_id      VARCHAR(50)  NOT NULL,
  form_title   VARCHAR(100) NOT NULL COMMENT '冗余快照',
  schema_version INT        NOT NULL,
  values_json  JSON         NOT NULL,
  submitted_at DATETIME     NOT NULL,
  KEY idx_app_student_time (student_no, submitted_at),
  CONSTRAINT fk_app_student FOREIGN KEY (student_no) REFERENCES students (student_no),
  CONSTRAINT fk_app_form FOREIGN KEY (form_id) REFERENCES guide_items (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
