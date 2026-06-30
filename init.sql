USE mydb;

SET FOREIGN_KEY_CHECKS = 0;

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

INSERT INTO users (username, password_hash, name)
VALUES ('niklas', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas Elofsson');

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
  exam_key VARCHAR(50) UNIQUE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE exam_blocks (
  exam_id INT,
  block_id INT,
  PRIMARY KEY (exam_id, block_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  UNIQUE (attempt_id, question_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE answer_options (
  answer_id INT,
  option_id INT,

  PRIMARY KEY (answer_id, option_id),

  FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(id)
) ENGINE=InnoDB;



CREATE TABLE exam_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT,
  exam_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id)
) ENGINE=InnoDB;


CREATE TABLE attempt_questions (
  attempt_id VARCHAR(36),
  question_id INT,

  PRIMARY KEY (attempt_id, question_id),

  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB;



-- ======================
-- BLOCK 1 (TEXT TAL)
-- ======================

INSERT INTO blocks (id, name) VALUES (1, 'Taluppfattning');

INSERT INTO questions VALUES (NULL,'Skriv 1 074 000 med ord.',1,1,JSON_OBJECT('mode', 'text'));
SET @q = LAST_INSERT_ID();

INSERT INTO options VALUES (NULL,@q,'en miljon sjuttiofyra tusen',1);

/*
INSERT INTO questions VALUES (NULL,'Skriv $1\\,200\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{en miljon tvåhundra tusen}$',1);

INSERT INTO questions VALUES (NULL,'Skriv $900\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{niohundra tusen}$',1);

INSERT INTO questions VALUES (NULL,'Skriv $2\\,300\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{två miljoner trehundra tusen}$',1);

INSERT INTO questions VALUES (NULL,'Skriv $1\\,050\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{en miljon femtio tusen}$',1);
*/

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

/*
INSERT INTO questions VALUES (NULL,'Vilket tal är närmast $30$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$30$',1),
(NULL,@q,'$25$',0),
(NULL,@q,'$35$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal ligger mitt mellan $20$ och $40$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$30$',1),
(NULL,@q,'$20$',0),
(NULL,@q,'$40$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal ligger mellan $10$ och $20$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$15$',1),
(NULL,@q,'$10$',0),
(NULL,@q,'$20$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal är störst av $40,45,50$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$50$',1),
(NULL,@q,'$45$',0),
(NULL,@q,'$40$',0);

*/

-- ======================
-- BLOCK 3 (ARITMETIK)
-- ======================

INSERT INTO blocks (id, name) VALUES (3, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'11\\cdot2+5',3,1,JSON_OBJECT('mode', 'numeric'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'27',1);

/*
INSERT INTO questions VALUES (NULL,'$12\\cdot2+3$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$27$',1);

INSERT INTO questions VALUES (NULL,'$9\\cdot3+2$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$29$',1);

INSERT INTO questions VALUES (NULL,'$8\\cdot4+1$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$33$',1);

INSERT INTO questions VALUES (NULL,'$7\\cdot5+3$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$38$',1);
*/

-- ======================
-- BLOCK 4 (NEGATIVA TAL)
-- ======================

INSERT INTO blocks (id, name) VALUES (4, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'Förenkla $a+a+a+a$',4,1,JSON_OBJECT('mode', 'algebra'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'4a',1);

/*
INSERT INTO questions VALUES (NULL,'$-5-10$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-15$',1);

INSERT INTO questions VALUES (NULL,'$-8+3$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-5$',1);

INSERT INTO questions VALUES (NULL,'$-6-6$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-12$',1);

INSERT INTO questions VALUES (NULL,'$-10+5$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-5$',1);
*/
/*
-- ======================
-- BLOCK 5 (DECIMAL MCQ)
-- ======================

INSERT INTO questions VALUES (NULL,'Vilket tal är störst: $0,74,0,78,0,7$?',5,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$0,78$',1),(NULL,@q,'$0,74$',0),(NULL,@q,'$0,7$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal är störst: $0,65,0,68,0,6$?',5,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$0,68$',1),(NULL,@q,'$0,65$',0),(NULL,@q,'$0,6$',0);

-- ======================
-- BLOCK 6 (DIVISION MCQ)
-- ======================

INSERT INTO questions VALUES (NULL,'Vad händer när man dividerar med $0,001$?',6,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'Mycket större',1),(NULL,@q,'Mindre',0),(NULL,@q,'Samma',0);

INSERT INTO questions VALUES (NULL,'Vad händer när man dividerar med $0,1$?',6,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'Större',1),(NULL,@q,'Mindre',0),(NULL,@q,'Samma',0);

-- ======================
-- BLOCK 8 (DECIMAL)
-- ======================

INSERT INTO questions VALUES (NULL,'$0,5\\cdot36$',8,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$18$',1);

INSERT INTO questions VALUES (NULL,'$0,04\\cdot0,4$',8,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$0,016$',1);

-- ======================
-- BLOCK 9 (GRUNDPOTENS)
-- ======================

INSERT INTO questions VALUES (NULL,'$0,038$ i grundpotensform',9,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$3,8\\cdot10^{-2}$',1);

-- ======================
-- BLOCK 10 (BRÅK)
-- ======================

*/

INSERT INTO blocks (id, name) VALUES (5, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'Vilket bråk är lika stora?',5,3,null);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'\\frac{5}{2}',0),
(NULL,@q,'\\frac{7}{4}',1),
(NULL,@q,'\\frac{14}{8}',1);

/*

-- ======================
-- BLOCK 11 (PROCENT)
-- ======================

INSERT INTO questions VALUES (NULL,'$300$ kr med $50\\%$',11,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$450$',1),(NULL,@q,'$400$',0),(NULL,@q,'$500$',0);

-- ======================
-- BLOCK 12 (PROCENTÖKNING)
-- ======================

INSERT INTO questions VALUES (NULL,'$20 \\rightarrow 25$',12,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$25\\%$',1),(NULL,@q,'$20\\%$',0),(NULL,@q,'$30\\%$',0);

-- ======================
-- BLOCK 13 (PROCENT MINSKNING)
-- ======================

INSERT INTO questions VALUES (NULL,'$7\\%$ minskning av $235$',13,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$235\\cdot0,93$',1),(NULL,@q,'$235\\cdot1,07$',0),(NULL,@q,'$235\\cdot0,07$',0);

-- ======================
-- BLOCK 14 (PROCENT)
-- ======================

INSERT INTO questions VALUES (NULL,'$15\\%$ av $200$',14,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$30$',1);

-- ======================
-- BLOCK 15 (EKVATION)
-- ======================

INSERT INTO questions VALUES (NULL,'$x-3=2x+10$',15,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$x=-13$',1);

-- ======================
-- BLOCK 16 (FÖRENKLA)
-- ======================

INSERT INTO questions VALUES (NULL,'$20x+8-11-3x$',16,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$17x-3$',1);

-- ======================
-- BLOCK 17 (OMKRETS)
-- ======================

INSERT INTO questions VALUES (NULL,'Omkrets $b$ och $5$',17,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$2b+10$',1);

-- ======================
-- BLOCK 18 (AREA)
-- ======================

INSERT INTO questions VALUES (NULL,'Area $b$ och $5$',18,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$5b$',1);
*/
-- ======================
-- EXAM BLOCKS
-- ======================

INSERT INTO exams VALUES(1,'Test','A');

INSERT INTO exam_blocks VALUES
(1,1),(1,2),(1,3),(1,4),(1,5);