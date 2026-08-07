USE mydb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS level_books;
DROP TABLE IF EXISTS question_levels;
DROP TABLE IF EXISTS block_sections;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS subchapters;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS block_central_content;
DROP TABLE IF EXISTS central_content;
DROP TABLE IF EXISTS content_areas;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS question_media;
DROP TABLE IF EXISTS group_users;
DROP TABLE IF EXISTS exam_users;
DROP TABLE IF EXISTS group_students;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS group_exams;
DROP TABLE IF EXISTS answer_options;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS exam_blocks;
DROP TABLE IF EXISTS exam_attempts;
DROP TABLE IF EXISTS attempt_questions;
DROP TABLE IF EXISTS attempt_options;
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

/*Typuppgifter*/
CREATE TABLE blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NOT NULL,

    deleted_at DATETIME NULL,

    CONSTRAINT fk_blocks_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT fk_blocks_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)

) ENGINE=InnoDB;

/*Svårighetsgrader*/
CREATE TABLE question_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL
);

/*Uppgifter*/
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT,
    block_id INT,
    question_type ENUM(
        'text',
        'single_choice',
        'multiple_choice'
    ),
    level_id INT NULL,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NOT NULL,

    deleted_at DATETIME NULL,
    
    answer_config JSON DEFAULT JSON_OBJECT('mode', 'numeric'),
    FOREIGN KEY (block_id) REFERENCES blocks(id),
    FOREIGN KEY (level_id) REFERENCES question_levels(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO question_levels
(
    name,
    description,
    sort_order
)
VALUES
(
    'Repetition',
    'Träning av tidigare genomgångna moment',
    1
),
(
    'Grundläggande',
    'Grundnivå som alla elever förväntas behärska',
    2
),
(
    'Påbyggnad',
    'Mer utmanande uppgifter som kräver djupare förståelse',
    3
),
(
    'Avancerad',
    'Komplexa uppgifter med hög problemlösningsgrad',
    4
);

/*Bilder till uppgifter*/
CREATE TABLE question_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    media_type ENUM('image','video') NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

/*Facit och alternativ på flervalsfrågor*/
CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT,
    text TEXT,
    is_correct BOOLEAN DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NOT NULL,

    deleted_at DATETIME NULL,

    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

/*Prov*/
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),

    subject_id INT NOT NULL,
    level_id INT NOT NULL,
    book_id INT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NOT NULL,

    deleted_at DATETIME NULL,

    exam_config JSON DEFAULT JSON_OBJECT('allowCalculator', 'false','allowFormulaSheet','true','defaultTimeLimit',60000)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

/*Personal kopplat till prov*/
CREATE TABLE exam_users (
    exam_id INT NOT NULL,
    user_id INT NOT NULL,

    is_owner BOOLEAN NOT NULL DEFAULT FALSE,

    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (exam_id, user_id),

    FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

/*Elevgrupper*/
CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/*Personal som är kopplad till grupp*/
CREATE TABLE group_users (
    group_id INT NOT NULL,
    user_id INT NOT NULL,

    is_owner BOOLEAN NOT NULL DEFAULT FALSE,

    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (group_id, user_id),

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

INSERT INTO groups (id, name)
VALUES
(1, 'Niklas grupp'),(2, 'Jolines grupp');

/*Provtillfällen*/
CREATE TABLE group_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,
    exam_id INT NOT NULL,

    group_exam_key VARCHAR(50) UNIQUE,
    exam_config JSON DEFAULT JSON_OBJECT(),

    time_limit_minutes INT DEFAULT NULL,

    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,

    allow_previous BOOLEAN NOT NULL DEFAULT FALSE,
    allow_same_question BOOLEAN NOT NULL DEFAULT FALSE,

    show_calculator BOOLEAN NOT NULL DEFAULT FALSE,
    show_formula_sheet BOOLEAN NOT NULL DEFAULT FALSE,

    max_attempts INT NOT NULL DEFAULT 1,

    show_result_immediately BOOLEAN DEFAULT TRUE,
    passing_score DECIMAL(5,2) DEFAULT NULL,
    
    is_open BOOLEAN DEFAULT FALSE,
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

/*Elever i grupper*/
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

/*Typyppgifter i prov*/
CREATE TABLE exam_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,

    exam_id INT NOT NULL,
    block_id INT NOT NULL,

    sort_order INT NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (exam_id, block_id),

    FOREIGN KEY (exam_id)
        REFERENCES exams(id),

    FOREIGN KEY (block_id)
        REFERENCES blocks(id)
);

/*Provtillfälle för elev*/
CREATE TABLE exam_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT,
    group_exam_id INT NOT NULL,
    exam_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    submitted_at DATETIME NULL,
    status ENUM(
        'not_started',
        'in_progress',
        'submitted',
        'graded'
    ) DEFAULT 'not_started',
    UNIQUE (group_exam_id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_exam_id) REFERENCES group_exams(id)
) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
;

/*Elevsvar på uppgift*/
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    exam_id INT,
    question_id INT,
    text_answer TEXT NULL,
    attempt_id VARCHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    UNIQUE (attempt_id, question_id)
) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

/**/
CREATE TABLE answer_options (
    answer_id INT,
    option_id INT,

    PRIMARY KEY (answer_id, option_id),

    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES options(id)
) ENGINE=InnoDB;

/*Provfrågor för elev*/
CREATE TABLE attempt_questions (
    attempt_id VARCHAR(36),
    question_id INT,
    sort_order INT,
    PRIMARY KEY (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

/*Alternativ på test*/
CREATE TABLE attempt_options (
    attempt_id VARCHAR(36) NOT NULL,
    option_id INT NOT NULL,
    sort_order INT NOT NULL,

    PRIMARY KEY (
        attempt_id,
        option_id
    ),

    CONSTRAINT fk_attempt_options_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES exam_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attempt_options_option
        FOREIGN KEY (option_id)
        REFERENCES options(id)
        ON DELETE CASCADE
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

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL
);

CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    chapter_number VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
);


CREATE TABLE subchapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    subchapter_number VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL,

    FOREIGN KEY (chapter_id)
        REFERENCES chapters(id)
);

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subchapter_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NULL,
    page_number INT,
    sort_order INT NOT NULL,

    FOREIGN KEY (subchapter_id)
        REFERENCES subchapters(id)
);

CREATE TABLE block_sections (
    block_id INT NOT NULL,
    section_id INT NOT NULL,

    PRIMARY KEY (
        block_id,
        section_id
    ),

    FOREIGN KEY (block_id)
        REFERENCES blocks(id),

    FOREIGN KEY (section_id)
        REFERENCES sections(id)
);

CREATE TABLE level_books (
    level_id INT NOT NULL,
    book_id INT NOT NULL,

    PRIMARY KEY (
        level_id,
        book_id
    ),

    FOREIGN KEY (level_id)
        REFERENCES levels(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);


-- ======================
-- BLOCK 1 (TEXT TAL)
-- ======================

INSERT INTO blocks (id,created_by,updated_by) VALUES (1,2,2);

INSERT INTO questions (id,question,block_id,created_by,updated_by,answer_config,question_type) VALUES (NULL,'Skriv 1 074 000 med ord.',1,2,2,JSON_OBJECT('grading_mode', 'text','default_answer','en miljon sjuttiofyra tusen'),'text');
SET @q = LAST_INSERT_ID();

INSERT INTO options (id,question_id,text,is_correct,created_by,updated_by) VALUES (NULL,@q,'en miljon sjuttiofyra tusen',1,2,2);


-- ======================
-- BLOCK 2 (TALLINJE MCQ)
-- ======================

INSERT INTO blocks (id,created_by,updated_by) VALUES (2,2,2);

INSERT INTO questions (id,question,block_id,created_by,updated_by,answer_config,question_type) VALUES (NULL,'Vilket tal är närmast 35.1?',2,2,2,JSON_OBJECT(),'single_choice');
SET @q = LAST_INSERT_ID();
INSERT INTO options (id,question_id,text,is_correct,created_by,updated_by) VALUES
(NULL,@q,'30',0,2,2),
(NULL,@q,'40',1,2,2),
(NULL,@q,'50',0,2,2);


-- ======================
-- BLOCK 3 (ARITMETIK)
-- ======================

INSERT INTO blocks (id,created_by,updated_by) VALUES (3,2,2);

INSERT INTO questions (id,question,block_id,created_by,updated_by,answer_config,question_type) VALUES (NULL,'Skriv $\\pi$ med minst 2 decimaler',3,2,2,JSON_OBJECT('grading_mode','numeric',"decimals",2,'default_answer','3.14'),'text');
SET @q = LAST_INSERT_ID();
INSERT INTO options (id,question_id,text,is_correct,created_by,updated_by) VALUES (NULL,@q,'3.1415',1,2,2);


-- ======================
-- BLOCK 4 (NEGATIVA TAL)
-- ======================

INSERT INTO blocks (id,created_by,updated_by) VALUES (4,2,2);

INSERT INTO questions (id,question,block_id,created_by,updated_by,answer_config,question_type) VALUES (NULL,'Förenkla $2x-1+x+7$',4,2,2,JSON_OBJECT('grading_mode', 'algebra','default_answer','6+3x'),'text');
SET @q = LAST_INSERT_ID();
INSERT INTO options (id,question_id,text,is_correct,created_by,updated_by) VALUES (NULL,@q,'3x+6',1,2,2);

/*
-- ======================
-- BLOCK 5 (DECIMAL MCQ)
-- ======================
*/
INSERT INTO blocks (id,created_by,updated_by) VALUES (5,2,2);

INSERT INTO questions (id,question,block_id,created_by,updated_by,answer_config,question_type) VALUES (NULL,'Lös ekvationen $x^2-5x+6=0$',5,2,2,JSON_OBJECT('grading_mode', 'variables','ignore_variable_names', true,'default_answer','x_1=3,x_2=2'),'text');
SET @q = LAST_INSERT_ID();
INSERT INTO options (id,question_id,text,is_correct,created_by,updated_by) VALUES (NULL,@q,'x_1=2,x_2=3',1,2,2);


-- ======================
-- BLOCK 6 BRÅK (ska tas bort)
-- ======================

INSERT INTO blocks (id,created_by,updated_by) VALUES (6,2,2);

INSERT INTO questions (id,question,block_id,created_by,updated_by,answer_config,question_type) VALUES (NULL,'Vilka tal är lika stora?',2,2,2,JSON_OBJECT(),'multiple_choice');
SET @q = LAST_INSERT_ID();
INSERT INTO options (id,question_id,text,is_correct,created_by,updated_by) VALUES
(NULL,@q,'$\\frac{3}{4}$',0,2,2),
(NULL,@q,'$\\frac{2}{3}$',1,2,2),
(NULL,@q,'$\\frac{4}{6}$',1,2,2),
(NULL,@q,'$\\frac{4}{3}$',0,2,2);



-- ======================
-- EXAM BLOCKS
-- ======================

INSERT INTO exams(`id`,`title`,subject_id,level_id,created_by,updated_by) VALUES(1,'Test',1,2,2,2);

INSERT INTO exam_users (exam_id,user_id,is_owner) VALUES (1,2,TRUE);

INSERT INTO group_users (group_id,user_id,is_owner) VALUES (1,2,TRUE);

INSERT INTO exam_blocks (exam_id,block_id,sort_order) VALUES
(1,5,3);
--(1,1,6),(1,2,2),(1,3,3),(1,4,4),(1,5,5),(1,6,1);


INSERT INTO group_exams(`exam_id`,`group_id`,`group_exam_key`,`is_open`,`time_limit_minutes`,`shuffle_questions`,`shuffle_options`,`allow_previous`) VALUES(1,1,'A',TRUE,15,TRUE,TRUE,FALSE);

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


INSERT INTO levels (
    subject_id,
    code,
    name
)
VALUES (
    1,
    'MAT7-9',
    'Matematik 7–9'
);

INSERT INTO content_areas (
    level_id,
    title,
    sort_order
)
VALUES
(3, 'Taluppfattning och tals användning', 1),
(3, 'Algebra', 2),
(3, 'Geometri', 3),
(3, 'Sannolikhet och statistik', 4),
(3, 'Samband och förändring', 5),
(3, 'Problemlösning', 6);

INSERT INTO central_content (area_id, content, sort_order)
VALUES
(10,'Reella tal och deras egenskaper samt talens användning i matematiska situationer.',1),
(10,'Talsystemets utveckling från naturliga tal till reella tal.',2),
(10,'Tal i potensform. Grundpotensform för att uttrycka små och stora tal samt användning av prefix.',3),
(10,'Matematiska lagar och regler samt deras användning vid beräkningar med tal i bråk-, decimal- och potensform.',4),
(10,'Metoder för beräkningar med tal i bråk- och decimalform vid överslagsräkning, huvudräkning och skriftlig beräkning. Användning av digitala verktyg vid beräkningar.',5),
(10,'Rimlighetsbedömning vid uppskattningar och beräkningar.',6);
INSERT INTO central_content (area_id, content, sort_order)
VALUES
(11,'Matematiska likheter samt hur likhetstecknet används för att teckna ekvationer och funktioner.',1),
(11,'Variablers användning i algebraiska uttryck, formler, ekvationer och funktioner.',2),
(11,'Metoder för att lösa linjära ekvationer och enkla andragradsekvationer.',3),
(11,'Mönster i talföljder och geometriska mönster samt hur de konstrueras, beskrivs och uttrycks generellt.',4),
(11,'Programmering i visuell och textbaserad programmeringsmiljö. Hur algoritmer skapas, testas och förbättras vid programmering.',5);
INSERT INTO central_content (area_id, content, sort_order)
VALUES
(12,'Geometriska objekt samt deras egenskaper och inbördes relationer. Konstruktion av geometriska objekt, såväl med som utan digitala verktyg.',1),
(12,'Metoder för beräkning av area, omkrets och volym hos geometriska objekt samt enhetsbyten i samband med detta.',2),
(12,'Geometriska satser och formler samt argumentation för deras giltighet.',3),
(12,'Skala vid förminskning och förstoring av två- och tredimensionella objekt.',4),
(12,'Likformighet och kongruens.',5);
INSERT INTO central_content (area_id, content, sort_order)
VALUES
(13,'Sannolikhet och metoder för att beräkna sannolikhet i olika situationer. Bedömningar av risker och chanser utifrån datorsimuleringar och statistiskt material.',1),
(13,'Kombinatoriska principer och hur de kan användas i olika situationer.',2),
(13,'Tabeller, diagram och grafer samt hur de tolkas och används för att beskriva resultat av egna och andras undersökningar, såväl med som utan digitala verktyg.',3),
(13,'Lägesmått och spridningsmått samt hur de används för bedömning av resultat vid statistiska undersökningar.',4);
INSERT INTO central_content (area_id, content, sort_order)
VALUES
(14,'Proportionalitet och hur det används för att uttrycka skala, likformighet och förändring.',1),
(14,'Härledda enheter, till exempel km/h och kr/kg.',2),
(14,'Procent och förändringsfaktor för att uttrycka förändring samt beräkningar med procent i vardagliga situationer och inom olika ämnesområden.',3),
(14,'Räta linjens ekvation och förändringstakt. Användning av räta linjens ekvation för att beskriva samband.',4),
(14,'Funktioner och hur de används för att beskriva samband och förändring samt undersöka förändringstakt. Hur funktioner uttrycks i form av grafer, tabeller och funktionsuttryck.',5);
INSERT INTO central_content (area_id, content, sort_order)
VALUES
(15,'Strategier för att lösa matematiska problem i olika situationer och inom olika ämnesområden samt värdering av valda strategier och metoder.',1),
(15,'Formulering av matematiska frågeställningar utifrån olika situationer och ämnesområden.',2),
(15,'Enkla matematiska modeller och hur de kan användas i olika situationer.',3);


INSERT INTO books (title)
VALUES ('Matematik 5000+ 1a Röd');

INSERT INTO chapters (
    book_id,
    chapter_number,
    title,
    sort_order
)
VALUES
(1, '1', 'Tal och beräkningar – grundläggande begrepp och metoder', 1),
(1, '2', 'Algebra', 2),
(1, '3', 'Funktioner', 3),
(1, '4', 'Sannolikhet och statistik', 4),
(1, '5', 'Geometri – repetition och fördjupning', 5);

INSERT INTO subchapters (
    chapter_id,
    subchapter_number,
    title,
    sort_order
)
VALUES

-- Kapitel 1
(1, '1.1', 'Tal i olika former', 1),
(1, '1.2', 'Tal och beräkningar', 2),
(1, '1.3', 'Andelar och förhållanden', 3),

-- Kapitel 2
(2, '2.1', 'Algebraiska uttryck och ekvationer', 1),
(2, '2.2', 'Mer om algebraiska uttryck och ekvationer', 2),
(2, '2.3', 'Formler', 3),

-- Kapitel 3
(3, '3.1', 'Grafer och funktioner', 1),
(3, '3.2', 'Linjära funktioner', 2),
(3, '3.3', 'Procentuella förändringar och exponentialfunktioner', 3),
(3, '3.4', 'Mer om funktionsbegreppet', 4),
(3, '3.5', 'Matematiska modeller', 5),

-- Kapitel 4
(4, '4.1', 'Repetition av sannolikhet', 1),
(4, '4.2', 'Slumpförsök i flera steg', 2),
(4, '4.3', 'Matematik och ekonomi', 3),
(4, '4.4', 'Statistik', 4),

-- Kapitel 5
(5, '5.1', 'Geometri och formler', 1),
(5, '5.2', 'Längdberäkningar', 2),
(5, '5.3', 'Repetition och lösningar', 3);


INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(1,'I vilken ordning ska vi räkna',10,1),
(1,'Negativa tal',14,2),
(1,'Aktivitet: Multiplikation och division med 10 och 100',17,3),
(1,'Tal i decimalform',18,4);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(2,'Avrundning',21,1),
(2,'Överslagsräkning och uppskattningar',24,2),
(2,'Enhetsbyten',27,3),
(2,'Aktivitet: Det är inte bara svaret som räknas!',30,4),
(2,'Tipotens­er',31,5),
(2,'Prefix',34,6),
(2,'Historik: Från vargben till datorer',37,7),
(2,'Tema: Måttenheter i köket',38,8),
(2,'Tema: Läkemedel',40,9),
(2,'Tema: Foderstater',42,10),
(2,'Tema: Begrepp som utvecklas under förskoletiden',44,11),
(2,'Aktivitet: Sant eller falskt?',77,12),
(2,'Sammanfattning 1',78,13),
(2,'Kan du det här?',80,14),
(2,'Testa dig själv 1',81,15),
(2,'Blandade övningar 1',82,16);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(3,'Tal i bråkform',46,1),
(3,'Beräkningar med tal i bråkform',49,2),
(3,'Beräkning av andelen i procent',52,3),
(3,'Beräkningar när vi vet procentsatsen',56,4),
(3,'Proportionalitet',59,5),
(3,'Tema: Moms',62,6),
(3,'Tema: Promille och ppm',64,7),
(3,'Tema: Vinst, förlust och vinstmarginal',66,8),
(3,'Tema: Svinnberäkningar i restaurang och dagligvaruhandel',68,9),
(3,'Tema: Gyllene snittet',70,10),
(3,'Tema: Underhållsservice och reparation',72,11),
(3,'Tema: Prissättning av aktiviteter',75,12);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(4,'Algebraiska uttryck',88,1),
(4,'Aktivitet: Vilka uttryck är lika?',91,2),
(4,'Skriva och förenkla uttryck',92,3),
(4,'Linjära ekvationer',94,4),
(4,'Ekvationer med flera variabeltermer',98,5),
(4,'Uttryck med parenteser',102,6),
(4,'Ekvationer med parenteser',104,7);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(5,'Bråk i uttryck och ekvationer',106,1),
(5,'Problemlösning med ekvationer',110,2),
(5,'Multiplikation av uttryck',114,3),
(5,'Faktorisera',117,4);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(6,'Beräkningar med formler',120,1),
(6,'Skriva och tolka formler',123,2),
(6,'Lösa ut ur formler',126,3),
(6,'Upptäcka och beskriva mönster',129,4),
(6,'Upptäcka och uttrycka generella samband',131,5),
(6,'Tema: Wilsonformeln (EOQ-formeln)',135,6),
(6,'Tema: Dos, styrka och mängd',136,7),
(6,'Tema: Glykemisk belastning',138,8),
(6,'Tema: Kondition',140,9),
(6,'Tema: Virkestransporter',142,10),
(6,'Tema: Stoppsträcka',144,11),
(6,'Aktivitet: Sant eller falskt?',146,12),
(6,'Sammanfattning 2',147,13),
(6,'Kan du det här?',148,14),
(6,'Testa dig själv 2',149,15),
(6,'Blandade övningar 2',150,16);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(7,'Koordinatsystem',156,1),
(7,'Funktion – formel, värdetabell och graf',159,2),
(7,'Aktivitet: Graf, formel, tabell och beskrivning',162,3),
(7,'Rita grafer med digitala verktyg',164,4),
(7,'Tema: Bostadsmatris',166,5);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(8,'Linjära funktioner i vardagliga sammanhang',168,1),
(8,'Egenskaper hos linjära funktioner',172,2),
(8,'Problemlösning med linjära funktioner',175,3);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(9,'Förändringsfaktor',177,1),
(9,'Procentuella förändringar och jämförelser',181,2),
(9,'Beräkning av förändringar i flera steg',184,3),
(9,'Aktivitet: Exponentialfunktioner y = c · a^x',188,4),
(9,'Exponentialfunktioner',189,5),
(9,'Tema: Avskrivning och värdeminskning',192,6);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(10,'Skrivsättet f(x)',194,1),
(10,'Grafisk lösning av ekvationen f(x)=a',197,2),
(10,'Ekvationslösning med digitalt verktyg',201,3);
INSERT INTO sections (subchapter_id, title, page_number, sort_order)
VALUES
(11,'Linjär funktion som modell',203,1),
(11,'Exponentialfunktion som modell',206,2),
(11,'Matematiska modeller – egenskaper och begränsningar',208,3),
(11,'Tema: Nollpunktsanalys',212,4),
(11,'Tema: Hur länge är läkemedlet verksamt?',214,5),
(11,'Tema: Proportionell styrning',216,6),
(11,'Aktivitet: Sant eller falskt?',217,7),
(11,'Sammanfattning 3',218,8),
(11,'Kan du det här?',220,9),
(11,'Testa dig själv 3',221,10),
(11,'Blandade övningar 3',225,11);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(12, 'Sannolikheten för en händelse', 230, 1),
(12, 'Sannolikhet och relativa frekvenser', 233, 2);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(13, 'Försök med två föremål', 235, 1),
(13, 'Träddiagram', 238, 2),
(13, 'Aktivitet: Lika eller olika färg?', 242, 3),
(13, 'Beroende händelser', 243, 4),
(13, 'Komplementhändelse', 245, 5);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(14, 'Beräkningar med kalkylprogram', 247, 1),
(14, 'Lån, ränta och amortering med kalkylprogram', 250, 2),
(14, 'Tema: Index', 254, 3),
(14, 'Tema: Kostnadsberäkning med kalkylprogram', 256, 4);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(15, 'Stickprov och urvalsmetoder', 259, 1),
(15, 'Aktivitet: Ett modellförsök av en väljarundersökning', 262, 2),
(15, 'Signifikans och felkällor', 263, 3),
(15, 'Aktivitet: Finns det några samband i elementinen?', 267, 4),
(15, 'Korrelation och kausalitet', 268, 5),
(15, 'Tema: Nöjd-kund-index', 273, 6),
(15, 'Tema: Statistik med Gapminder', 274, 7),
(15, 'Aktivitet: Sant eller falskt?', 275, 8),
(15, 'Sammanfattning 4', 276, 9),
(15, 'Kan du det här?', 278, 10),
(15, 'Testa dig själv 4', 279, 11),
(15, 'Blandade övningar 4', 280, 12),
(15, 'Blandade övningar 1–4', 282, 13);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(16, 'Omkrets och area', 288, 1),
(16, 'Tema: Stora och små planteringar', 293, 2),
(16, 'Volym', 296, 3),
(16, 'Begränsningsarea', 301, 4),
(16, 'Tema: Djur i bur', 303, 5),
(16, 'Tema: Hjärtats slagvolym', 305, 6),
(16, 'Tema: Turismens klimatpåverkan', 307, 7);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(17, 'Likformighet, skala och ritningar', 309, 1),
(17, 'Kvadratrötter och ekvationen x² = a', 312, 2),
(17, 'Pythagoras sats', 315, 3);
INSERT INTO sections (
    subchapter_id,
    title,
    page_number,
    sort_order
)
VALUES
(18, 'Repetitionsuppgifter', 319, 1),
(18, 'Svar, ledtrådar och lösningar', 326, 2),
(18, 'Register', 373, 3);

INSERT INTO books (title)
VALUES ('Matematik 5000+ 1b');

INSERT INTO chapters (
    book_id,
    chapter_number,
    title,
    sort_order
)
VALUES
(2, '1', 'Aritmetik och algebra', 1),
(2, '2', 'Potenser och formler', 2),
(2, '3', 'Funktioner', 3),
(2, '4', 'Sannolikhet och statistik', 4);

INSERT INTO subchapters (
    chapter_id,
    subchapter_number,
    title,
    sort_order
)
VALUES

-- Kapitel 1
(6, '1.1', 'Repetition av räkneregler', 1),
(6, '1.2', 'Repetition av bråk och decimaltal', 2),
(6, '1.3', 'Uttryck och ekvationer', 3),
(6, '1.4', 'Mer om uttryck och ekvationer', 4),
(6, '1.5', 'Procent och förändringsfaktor', 5),

-- Kapitel 2
(7, '2.1', 'Potenser', 1),
(7, '2.2', 'Potensekvationer', 2),
(7, '2.3', 'Uttryck och formler', 3),
(7, '2.4', 'Algebra och geometriska formler', 4),
(7, '2.5', 'Mönster och generella samband', 5),

-- Kapitel 3
(8, '3.1', 'Grafer och funktioner', 1),
(8, '3.2', 'Räta linjens ekvation', 2),
(8, '3.3', 'Olikheter', 3),
(8, '3.4', 'Funktioner och skrivsättet f(x)', 4),
(8, '3.5', 'Olika typer av funktioner', 5),

-- Kapitel 4
(9, '4.1', 'Repetition av sannolikhet', 1),
(9, '4.2', 'Slumpförsök i flera steg', 2),
(9, '4.3', 'Matematik och ekonomi', 3),
(9, '4.4', 'Statistik', 4),
(9, '4.5', 'Repetition och lösningar', 5);

INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(19,'Prioriteringsregler',10,1),
(19,'Negativa tal',13,2);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(20,'Tal i bråkform',17,1),
(20,'Aktivitet: Minsta gemensamma nämnare (MGN) och primtal',21,2),
(20,'Addition och subtraktion av tal i bråkform',22,3),
(20,'Historik: Historiska bråk',24,4),
(20,'Multiplikation och division av tal i bråkform',25,5),
(20,'Tema: Aritmetik',28,6),
(20,'Tal i decimalform och avrundning',29,7),
(20,'Aktivitet: Värdet av ett algebraiskt uttryck',33,8);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(21,'Algebraiska uttryck',34,1),
(21,'Aktivitet: Vilka uttryck är lika?',38,2),
(21,'Linjära ekvationer',39,3),
(21,'Aktivitet: Ekvationsbilder',43,4),
(21,'Ekvationer med flera variabeltermer',44,5),
(21,'Historik: Algebra genom tiderna',48,6);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(22,'Multiplicera in i parenteser',49,1),
(22,'Uttryck och ekvationer med parenteser',52,2),
(22,'Uttryck, ekvationer och bråk',55,3),
(22,'Tillämpningar och problemlösningar',59,4);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(23,'Repetition av procentberäkningar',64,1),
(23,'Tema: Gyllene snittet',68,2),
(23,'Förändringsfaktor',70,3),
(23,'Tema: Moms',74,4),
(23,'Procentuella förändringar och jämförelser',76,5),
(23,'Procentuella förändringar i flera steg',79,6),
(23,'Aktivitet: Sant eller falskt?',83,7),
(23,'Sammanfattning 1',84,8),
(23,'Kan du det här?',86,9),
(23,'Testa dig själv 1',87,10),
(23,'Blandade övningar 1',88,11);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(24,'Potenslagar',94,1),
(24,'Exponenten noll och negativa exponenter',98,2),
(24,'Aktivitet: Vilka är lika?',102,3),
(24,'Mer om potenser och potenslagar',103,4);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(25,'Kvadratrötter och ekvationen x² = a',105,1),
(25,'Tema: Potenser',109,2),
(25,'Potensekvationen xⁿ = a',110,3),
(25,'Ekvationslösning med digitalt verktyg',114,4);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(26,'Multiplikation av uttryck',116,1),
(26,'Faktorisera',120,2),
(26,'Aktivitet: Förenkla med digitalt verktyg',123,3),
(26,'Använda och tolka formler',124,4),
(26,'Lösa ut ur formler',128,5),
(26,'Tema: Algebra',130,6);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(27,'Repetition av prefix och enhetsbyten',131,1),
(27,'Formler för area och omkrets',134,2),
(27,'Formler för volym',137,3);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(28,'Upptäcka och beskriva mönster',140,1),
(28,'Upptäcka och uttrycka generella samband',143,2),
(28,'Aktivitet: Det är inte bara svaret som räknas!',148,3),
(28,'Aktivitet: Sant eller falskt?',149,4),
(28,'Sammanfattning 2',150,5),
(28,'Kan du det här?',152,6),
(28,'Testa dig själv 2',153,7),
(28,'Blandade övningar 2',154,8),
(28,'Blandade övningar 1–2',157,9);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(29,'Koordinatsystem',162,1),
(29,'Historik: René Descartes',162,2),
(29,'Funktion – Formel, värdetabell och graf',166,3),
(29,'Aktivitet: Graf, formel, tabell och beskrivning',170,4),
(29,'Rita grafer med digitala verktyg',172,5),
(29,'Räta linjer i vardagliga sammanhang',174,6),
(29,'Aktivitet: Räta linjer med gräfinrande verktyg',178,7);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(30,'Avläsa k-värde och m-värde',179,1),
(30,'Beräkna k-värdet och rita linjen',184,2),
(30,'Bestäm räta linjens ekvation',188,3),
(30,'Parallella linjer',191,4),
(30,'Olika former för räta linjens ekvation',193,5);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(31,'Intervall',196,1),
(31,'Linjära olikheter',199,2),
(31,'Tema: Olikheter',202,3);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(32,'Skrivsättet f(x)',203,1),
(32,'Tema: Funktioner',207,2),
(32,'Grafisk lösning av ekvationer och olikheter',208,3),
(32,'Aktivitet: Tärtljus',212,4),
(32,'Definitionsmängd och värdemängd',213,5);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(33,'Linjära funktioner',216,1),
(33,'Aktivitet: Exponentialfunktioner y = C · a^x',220,2),
(33,'Exponentialfunktioner',221,3),
(33,'Potensfunktioner',225,4),
(33,'Aktivitet: Para ihop formel och graf',230,5),
(33,'Matematiska modeller – egenskaper och begränsningar',231,6),
(33,'Aktivitet: Sant eller falskt?',237,7),
(33,'Sammanfattning 3',238,8),
(33,'Kan du det här?',240,9),
(33,'Testa dig själv 3',241,10),
(33,'Blandade övningar 3',242,11),
(33,'Blandade övningar 1–3',246,12);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(34,'Sannolikheten för en händelse',252,1),
(34,'Sannolikhet och relativ frekvens',256,2);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(35,'Försök med två föremål',258,1),
(35,'Träddiagram',261,2),
(35,'Aktivitet: Lika eller olika färg?',265,3),
(35,'Beroende händelser',266,4),
(35,'Aktivitet: Byta eller inte byta?',268,5),
(35,'Komplementhändelse',269,6),
(35,'Historik: Tärningsspel och sannolikhetens födelse',271,7),
(35,'Tema: Sannolikhet',272,8);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(36,'Repetition av procent och procentenheter',273,1),
(36,'Index',275,2),
(36,'Lån, ränta och amortering',280,3),
(36,'Tema: Vinst, förlust och vinstmarginal',283,4),
(36,'En introduktion till kalkylprogram',284,5),
(36,'Lån, ränta och amortering med kalkylprogram',286,6),
(36,'Krediter och avgifter',290,7);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(37,'Stickprov och urvalsmetoder',294,1),
(37,'Signifikans och felkällor',298,2),
(37,'Aktivitet: Ett modellförsök av en väljarundersökning',303,3),
(37,'Aktivitet: Finns det några samband i elementen?',304,4),
(37,'Korrelation och kausalitet',305,5),
(37,'Tema: Statistik med Gapminder',310,6),
(37,'Aktivitet: Sant eller falskt?',311,7),
(37,'Sammanfattning 4',312,8),
(37,'Kan du det här?',314,9),
(37,'Testa dig själv 4',315,10),
(37,'Blandade övningar 4',316,11),
(37,'Blandade övningar 1–4',318,12);
INSERT INTO sections (subchapter_id,title,page_number,sort_order)
VALUES
(38,'Repetitionsuppgifter',322,1),
(38,'Svar, ledtrådar och lösningar',330,2),
(38,'Register',392,3);

INSERT INTO level_books (level_id, book_id) VALUES (2,1);