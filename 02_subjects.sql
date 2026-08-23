USE mydb;

/* =====================================================
   SUBJECTS
   ===================================================== */

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) UNIQUE,

    sort_order INT,

    name VARCHAR(100)
);

/* =====================================================
   LEVELS
   ===================================================== */

CREATE TABLE levels (
    id INT AUTO_INCREMENT PRIMARY KEY,

    subject_id INT NOT NULL,

    code VARCHAR(20) UNIQUE,

    sort_order INT,

    name VARCHAR(100),

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
);

/* =====================================================
   CONTENT AREAS
   ===================================================== */

CREATE TABLE content_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    level_id INT NOT NULL,

    title VARCHAR(255),

    sort_order INT,

    FOREIGN KEY (level_id)
        REFERENCES levels(id)
);

/* =====================================================
   CENTRAL CONTENT
   ===================================================== */

CREATE TABLE central_content (
    id INT AUTO_INCREMENT PRIMARY KEY,

    area_id INT NOT NULL,

    content TEXT,

    sort_order INT,

    FOREIGN KEY (area_id)
        REFERENCES content_areas(id)
);

/* =====================================================
   COMPETENCIES
   ===================================================== */

CREATE TABLE competencies (
    id INT AUTO_INCREMENT PRIMARY KEY,

    subject_id INT NOT NULL,

    sort_order INT,

    name VARCHAR(100) NOT NULL,

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
);

/* =====================================================
   COMPETENCY DESCRIPTORS
   ===================================================== */

CREATE TABLE competency_descriptors (
    id INT AUTO_INCREMENT PRIMARY KEY,

    level_id INT NOT NULL,

    competency_id INT NOT NULL,

    grade ENUM(
        'E',
        'C',
        'A'
    ) NOT NULL,

    sort_order INT,

    description LONGTEXT NOT NULL,

    FOREIGN KEY (level_id)
        REFERENCES levels(id)
        ON DELETE CASCADE,

    FOREIGN KEY (competency_id)
        REFERENCES competencies(id)
        ON DELETE CASCADE,

    UNIQUE (
        level_id,
        competency_id,
        grade
    )
);