
USE mydb;

DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS exam_blocks;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS exams;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  exam_key VARCHAR(50) UNIQUE
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT,
  block_id INT,
  type INT DEFAULT 2
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE TABLE options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  text TEXT,
  is_correct BOOLEAN DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE TABLE exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255)
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE TABLE exam_blocks (
  exam_id INT,
  block_id INT,
  PRIMARY KEY (exam_id, block_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  exam_id INT,
  question_id INT,
  option_id INT NULL,
  text_answer TEXT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (option_id) REFERENCES options(id),

  UNIQUE (user_id, question_id)
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
