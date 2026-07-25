USE mydb;

SET FOREIGN_KEY_CHECKS = 0;


DROP TABLE IF EXISTS block_central_content;
DROP TABLE IF EXISTS central_content;
DROP TABLE IF EXISTS content_areas;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS question_media;
DROP TABLE IF EXISTS exam_teachers;
DROP TABLE IF EXISTS group_students;
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
    first_name VARCHAR(255),
    last_name VARCHAR(255),

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

INSERT INTO users (id, username, password_hash, first_name, last_name, role)
VALUES (1, 'student', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas', 'Elofsson' , 'student'),
(2, 'teacher', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas', 'Elofsson' , 'teacher'),
(3, 'admin', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas', 'Elofsson' , 'admin'),
(4, 'Abba', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Abba', 'Babby' , 'student'),
(5, 'Betty', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Betty', 'Blue' , 'student'),
(6, 'Calle', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Calle', 'Arvidsson' , 'student');

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

CREATE TABLE question_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    media_type ENUM('image','video') NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

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
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO groups (id, name)
VALUES
(1, 'Niklas grupp'),(2, 'Joines grupp');

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

CREATE TABLE group_students (
    user_id INT NOT NULL,
    group_id INT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, group_id),

    CONSTRAINT fk_group_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_students_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

INSERT INTO group_students (user_id, group_id)
VALUES (1, 1),(4, 2),(5, 2),(6, 2);

CREATE TABLE exam_blocks (
    exam_id INT,
    block_id INT,
    order_by INT,
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


CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(100)
);

CREATE TABLE levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(100),
    FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
);

CREATE TABLE content_areas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level_id INT NOT NULL,
    title VARCHAR(255),
    sort_order INT,
    FOREIGN KEY (level_id)
        REFERENCES levels(id)
);

CREATE TABLE central_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    area_id INT NOT NULL,
    content TEXT,
    sort_order INT,
    FOREIGN KEY (area_id)
        REFERENCES content_areas(id)
);

CREATE TABLE block_central_content (
    block_id INT NOT NULL,
    central_content_id INT NOT NULL,

    PRIMARY KEY (
        block_id,
        central_content_id
    ),

    FOREIGN KEY (block_id)
        REFERENCES blocks(id)
        ON DELETE CASCADE,

    FOREIGN KEY (central_content_id)
        REFERENCES central_content(id)
        ON DELETE CASCADE
);


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

INSERT INTO exam_teachers (exam_id,teacher_id,is_owner) VALUES (1,2,TRUE);

INSERT INTO exam_blocks VALUES
(1,1,1),(1,2,2),(1,3,3),(1,4,4),(1,5,5);

INSERT INTO group_exams(`exam_id`,`group_id`,`group_exam_key`) VALUES(1,1,'A');

--Matematik 

INSERT INTO subjects (
    id,
    code,
    name
)
VALUES (
    '1',
    'MATE',
    'Matematik'
);


--Niva 1a
INSERT INTO levels (
    subject_id,
    code,
    name
)
VALUES (
    '1',
    'MATE1A00X',
    'Matematik nivå 1a'
);
INSERT INTO content_areas (
    level_id,
    title,
    sort_order
)
VALUES
(1, 'Program- eller yrkesspecifikt innehåll', 1),
(1, 'Aritmetik, algebra och funktioner', 2),
(1, 'Sannolikhet och statistik', 3),
(1, 'Digitala verktyg', 4),
(1, 'Problemlösning och tillämpningsområden', 5);
INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(1, 'Matematiska begrepp som är relevanta för arbetslivet, till exempel proportionalitet, skala, likformighet, vinklar, Pythagoras sats, procent och andelar, indexmått, vinstmarginal, jämvikt, felmarginaler, symmetrier, vektorer, trigonometriska funktioner och barns lärande inom matematik.', 1),
(1, 'Beräkningsmetoder som är relevanta för arbetslivet, till exempel uppskattningar, beräkningar på störningar eller mätfel, spill- och svinnberäkningar, överslagsräkning, avrundning, användning av kalkylprogram och metoder för kontrollberäkning.', 2),
(1, 'Hantering av formler som är relevanta för arbetslivet.', 3),
(1, 'Mätning och hantering av storheter och enheter som är relevanta för arbetslivet, till exempel enhetsbyten, mätning av vinklar, avrundningsprinciper, tidsuppskattningar, beräkning av förbrukningsmaterial, kostnadsberäkningar, säkerhetsmarginaler, hantering av mätverktyg och hantering av mätosäkerheter.', 4),
(1, 'Hjälpmedel och verktyg som är relevanta för att hantera matematik inom arbetslivet, till exempel formulär, mallar, tumregler, föreskrifter, manualer, referensverk och handböcker.', 5);
INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(2, 'Hantering av formler och algebraiska uttryck, däribland faktorisering och multiplicering av uttryck.', 1),
(2, 'Begreppet funktion. Representationer av funktioner i form av ord, funktionsuttryck, tabeller och grafer. Digitala metoder för att skapa funktionsgrafer.', 2),
(2, 'Metoder för att bestämma funktionsvärden. Grafiska metoder för att lösa ekvationer av typen f(x) = a.', 3),
(2, 'Begreppet linjär funktion och egenskaper hos linjära funktioner.', 4),
(2, 'Metoder för att lösa linjära ekvationer.', 5),
(2, 'Begreppet exponentialfunktion och egenskaper hos exponentialfunktioner. Skillnader och likheter med linjära funktioner.', 6),
(2, 'Begreppet förändringsfaktor och beräkning av förändringar i flera steg.', 7);
INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(3, 'Begreppen oberoende och beroende händelse samt komplementhändelse. Metoder för att beräkna sannolikheter i flera steg. Tillämpningar inom spel samt risk- och säkerhetsbedömningar.', 1),
(3, 'Exempel på hur några statistiska begrepp används i samhälle och arbetsliv, däribland signifikans, korrelation, kausalitet, urvalsmetoder och felkällor.', 2);
INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(4, 'Användning av kalkylprogram för beräkning av ränta och amortering.', 1),
(4, 'Användning av digitala verktyg för att effektivisera beräkningar och komplettera metoder, till exempel vid ekvationslösning och problemlösning.', 2);
INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(5, 'Problemlösning som omfattar att upptäcka och uttrycka generella samband.', 1),
(5, 'Problemlösning med särskild utgångspunkt i arbetslivet samt privatekonomi och samhällsliv, däribland frågeställningar som berör hållbar utveckling och hur matematik kan användas för kritisk granskning av fakta och påståenden.', 2),
(5, 'Tillämpning och formulering av matematiska modeller i realistiska situationer. Utvärdering av matematiska modellers egenskaper och begränsningar.', 3),
(5, 'Orientering om något ur matematikens historia, till exempel hur ett matematiskt begrepp utvecklats, matematikens roll i något historiskt skeende, en betydande person inom matematiken eller ett historiskt matematiskt problem.', 4);


--Nivå 1b
INSERT INTO levels (
    subject_id,
    code,
    name
)
VALUES (
    '1',
    'MATE1B00X',
    'Matematik nivå 1b'
);
INSERT INTO content_areas (
    level_id,
    title,
    sort_order
)
VALUES
(2, 'Aritmetik, algebra och funktioner', 6),
(2, 'Sannolikhet och statistik', 7),
(2, 'Digitala verktyg', 8),
(2, 'Problemlösning och tillämpningsområden', 9);

INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(6, 'Hantering av formler och algebraiska uttryck, däribland faktorisering och multiplicering av uttryck.', 1),
(6, 'Begreppen funktion, definitionsmängd och värdemängd. Representationer av funktioner i form av ord, funktionsuttryck, tabeller och grafer. Digitala metoder för att skapa funktionsgrafer.', 2),
(6, 'Metoder för att bestämma funktionsvärden. Digitala och grafiska metoder för att lösa ekvationer av typen f(x) = a.', 3),
(6, 'Begreppet linjär funktion och egenskaper hos linjära funktioner. Räta linjens ekvation. Metoder för att bestämma linjära funktioner.', 4),
(6, 'Metoder för att lösa linjära ekvationer.', 5),
(6, 'Begreppen intervall och linjär olikhet. Metoder för att lösa linjära olikheter.', 6),
(6, 'Begreppet exponentialfunktion och egenskaper hos exponentialfunktioner. Skillnader och likheter med linjära funktioner.', 7),
(6, 'Motivering och hantering av räkneregler för potenser. Metoder för att lösa potensekvationer.', 8),
(6, 'Begreppet potensfunktion.', 9),
(6, 'Begreppet förändringsfaktor och beräkning av förändringar i flera steg.', 10);

INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(7, 'Begreppet index.', 1),
(7, 'Begreppen oberoende och beroende händelse samt komplementhändelse. Metoder för att beräkna sannolikheter i flera steg. Tillämpningar inom spel samt risk- och säkerhetsbedömningar.', 2),
(7, 'Exempel på hur några statistiska begrepp används i samhälle och inom vetenskap, däribland signifikans, korrelation, kausalitet, urvalsmetoder och felkällor.', 3);

INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(8, 'Användning av kalkylprogram för beräkning av ränta och amortering.', 1),
(8, 'Användning av digitala verktyg för att effektivisera beräkningar och komplettera metoder, till exempel vid ekvationslösning och problemlösning.', 2);

INSERT INTO central_content (
    area_id,
    content,
    sort_order
)
VALUES
(9, 'Problemlösning som omfattar att upptäcka och uttrycka generella samband.', 1),
(9, 'Problemlösning med särskild utgångspunkt i utbildningens karaktär, privatekonomi och samhällsliv, däribland frågeställningar som berör hållbar utveckling och hur matematik kan användas för kritisk granskning av fakta och påståenden.', 2),
(9, 'Tillämpning och formulering av matematiska modeller i realistiska situationer. Utvärdering av matematiska modellers egenskaper och begränsningar.', 3),
(9, 'Orientering om något ur matematikens historia, till exempel hur ett matematiskt begrepp utvecklats, matematikens roll i något historiskt skeende, en betydande person inom matematiken eller ett historiskt matematiskt problem.', 4);



INSERT INTO block_central_content (block_id, central_content_id)
VALUES (1, 1),(2, 1),(3, 2),(4,2);