
USE mydb;

-- ✅ DROPS i rätt ordning
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS exams;

-- ✅ USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255)
);

INSERT INTO users (name) VALUES ('Alice'), ('Bob');

-- ✅ QUESTIONS
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO questions (question) VALUES 
('Beräkna $-1-5$'),
('Beräkna $-1+5$');

-- ✅ OPTIONS
CREATE TABLE options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  text TEXT,
  is_correct BOOLEAN DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

INSERT INTO options (question_id, text, is_correct) VALUES
(1, '-6', 1),
(1, '6', 0),
(1, '3', 0),

(2, '4', 1),
(2, '2', 0),
(2, '3', 0);

-- ✅ EXAMS
CREATE TABLE exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255)
);

INSERT INTO exams (title) VALUES ('Test 1');

-- ✅ EXAM_QUESTIONS
CREATE TABLE exam_questions (
  exam_id INT,
  question_id INT,
  PRIMARY KEY (exam_id, question_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

INSERT INTO exam_questions (exam_id, question_id) VALUES
(1, 1),
(1, 2);

-- ✅ ANSWERS
CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT,
  question_id INT,
  option_id INT,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (option_id) REFERENCES options(id)
);
