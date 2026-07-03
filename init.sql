USE mydb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS exam_teachers;
DROP TABLE IF EXISTS student_groups;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS group_exams;
DROP TABLE IF EXISTS answer_options;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS exam_blocks;
DROP TABLE IF EXISTS exam_attempts;
DROP TABLE IF EXISTS attempt_questions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ======================
-- TABLES
-- ======================


CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,

  username VARCHAR(100) UNIQUE NOT NULL,

  -- lösenord (aldrig plaintext!)
  password_hash VARCHAR(255) NOT NULL,

  role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',

  -- valfri visning
  name VARCHAR(255),

  -- för koppling till prov
  user_key VARCHAR(100) UNIQUE,

  -- session (aktiv login)
  session_token VARCHAR(255),

  -- login / exam status
  last_login DATETIME,
  exam_started_at DATETIME,

  -- säkerhetsfält
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

INSERT INTO users (id, username, password_hash, name, role)
VALUES (1, 'niklas', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas Elofsson' , 'teacher');

CREATE TABLE blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT,
  block_id INT,
  type INT DEFAULT 1,
  math_config JSON DEFAULT JSON_OBJECT('mode', 'numeric'),
  FOREIGN KEY (block_id) REFERENCES blocks(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  text TEXT,
  is_correct BOOLEAN DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  exam_config JSON DEFAULT JSON_OBJECT('timer', '1000','allowPrevious','false','randomizeQuestions',1,'randomizeOptions',1)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE exam_teachers (
    exam_id INT NOT NULL,
    teacher_id INT NOT NULL,

    is_owner BOOLEAN NOT NULL DEFAULT FALSE,

    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (exam_id, teacher_id),

    FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO groups (id, name)
VALUES
(1, 'Niklas grupp');

CREATE TABLE group_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,
    exam_id INT NOT NULL,

    group_exam_key VARCHAR(50) UNIQUE,
    exam_config JSON DEFAULT JSON_OBJECT('timer', '1000','allowPrevious','false','randomizeQuestions',1,'randomizeOptions',1),

    time_limit_minutes INT DEFAULT NULL,

    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,

    max_attempts INT NOT NULL DEFAULT 1,

    show_result_immediately BOOLEAN DEFAULT TRUE,
    passing_score DECIMAL(5,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    available_from DATETIME DEFAULT NULL,
    available_until DATETIME DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_exams_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_exams_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_group_exam (group_id, exam_id)
);

CREATE TABLE student_groups (
    user_id INT NOT NULL,
    group_id INT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, group_id),

    CONSTRAINT fk_student_groups_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_groups_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

INSERT INTO student_groups (user_id, group_id)
VALUES (1, 1);

CREATE TABLE exam_blocks (
  exam_id INT,
  block_id INT,
  PRIMARY KEY (exam_id, block_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;


CREATE TABLE exam_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT,
  group_exam_id INT NOT NULL,
  exam_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (group_exam_id) REFERENCES group_exams(id)
) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
;


CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  exam_id INT,
  question_id INT,
  option_id INT NULL,
  text_answer TEXT NULL,
  attempt_id VARCHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (option_id) REFERENCES options(id),
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  UNIQUE (attempt_id, question_id)
) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE TABLE answer_options (
  answer_id INT,
  option_id INT,

  PRIMARY KEY (answer_id, option_id),

  FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(id)
) ENGINE=InnoDB;

CREATE TABLE attempt_questions (
  attempt_id VARCHAR(36),
  question_id INT,
  order_by INT,
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;



-- ======================
-- BLOCK 1 (TEXT TAL)
-- ======================

INSERT INTO blocks (id, name) VALUES (1, 'Taluppfattning');

INSERT INTO questions VALUES (NULL,'Skriv 1 074 000 med ord.',1,1,JSON_OBJECT('mode', 'text'));
SET @q = LAST_INSERT_ID();

INSERT INTO options VALUES (NULL,@q,'en miljon sjuttiofyra tusen',1);


-- ======================
-- BLOCK 2 (TALLINJE MCQ)
-- ======================

INSERT INTO blocks (id, name) VALUES (2, 'Taluppfattning');

INSERT INTO questions VALUES (NULL,'Vilket tal är närmast 35.1?',2,3,null);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'30',0),
(NULL,@q,'40',1),
(NULL,@q,'50',0);


-- ======================
-- BLOCK 3 (ARITMETIK)
-- ======================

INSERT INTO blocks (id, name) VALUES (3, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'11\\cdot2+5',3,1,JSON_OBJECT('mode', 'numeric'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'27',1);


-- ======================
-- BLOCK 4 (NEGATIVA TAL)
-- ======================

INSERT INTO blocks (id, name) VALUES (4, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'Förenkla $a+a+a+a$',4,1,JSON_OBJECT('mode', 'algebra'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'4a',1);

/*
-- ======================
-- BLOCK 5 (DECIMAL MCQ)
-- ======================
*/
INSERT INTO blocks (id, name) VALUES (5, 'Algebra');

INSERT INTO questions VALUES (NULL,'Lös ekvationen $x^2-5x+6=0$',5,1,JSON_OBJECT('mode', 'algebra','default','x_1=a,x_2=b'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'x_1=2,x_2=3',1),(NULL,@q,'x_1=3,x_2=2',1);

-- ======================
-- EXAM BLOCKS
-- ======================

INSERT INTO exams(`id`,`title`) VALUES(1,'Test');

INSERT INTO exam_teachers (exam_id,teacher_id,is_owner) VALUES (1,1,TRUE);

INSERT INTO exam_blocks VALUES
(1,1),(1,2),(1,3),(1,4),(1,5);

INSERT INTO group_exams(`exam_id`,`group_id`,`group_exam_key`) VALUES(1,1,'A');