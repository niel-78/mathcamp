USE mydb;

/* =====================================================
   BLOCKS
   ===================================================== */

CREATE TABLE blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,

    school_id INT NOT NULL,

    sort_order INT,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    archived_at DATETIME NULL,
    deleted_at DATETIME NULL,

    visibility ENUM(
        'private',
        'school',
        'global'
    ) NOT NULL DEFAULT 'school',

    CONSTRAINT fk_blocks_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_blocks_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT fk_blocks_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)

) ENGINE=InnoDB;

/* =====================================================
   QUESTION LEVELS
   ===================================================== */

CREATE TABLE question_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) NOT NULL,

    sort_order INT,

    description TEXT,

    sort_order INT NOT NULL
);

/* =====================================================
   QUESTIONS
   ===================================================== */

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

    sort_order INT,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    archived_at DATETIME NULL,
    deleted_at DATETIME NULL,

    answer_config JSON,

    FOREIGN KEY (block_id)
        REFERENCES blocks(id),

    FOREIGN KEY (level_id)
        REFERENCES question_levels(id)

) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

/* =====================================================
   QUESTION MEDIA
   ===================================================== */

CREATE TABLE question_media (
    id INT AUTO_INCREMENT PRIMARY KEY,

    question_id INT NOT NULL,

    media_type ENUM(
        'image',
        'video'
    ) NOT NULL,

    media_url VARCHAR(500) NOT NULL,

    sort_order INT DEFAULT 0,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

/* =====================================================
   OPTIONS
   ===================================================== */

CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,

    question_id INT,

    text TEXT,

    sort_order INT,

    is_correct BOOLEAN DEFAULT 0,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    deleted_at DATETIME NULL,

    FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

/* =====================================================
   BLOCK SECTIONS
   ===================================================== */

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

/* =====================================================
   BLOCK ABILITIES
   ===================================================== */

CREATE TABLE block_abilities (
    block_id INT NOT NULL,

    ability_id INT NOT NULL,

    PRIMARY KEY (
        block_id,
        ability_id
    ),

    FOREIGN KEY (block_id)
        REFERENCES blocks(id),

    FOREIGN KEY (ability_id)
        REFERENCES abilities(id)
);

/* =====================================================
   BLOCK POINTS
   ===================================================== */

CREATE TABLE block_points (
    id INT AUTO_INCREMENT PRIMARY KEY,

    block_id INT NOT NULL,

    central_content_id INT NULL,

    competency_descriptor_id INT NULL,

    points INT NOT NULL DEFAULT 1,

    comment TEXT NULL,

    FOREIGN KEY (block_id)
        REFERENCES blocks(id)
        ON DELETE CASCADE,

    FOREIGN KEY (central_content_id)
        REFERENCES central_content(id),

    FOREIGN KEY (competency_descriptor_id)
        REFERENCES competency_descriptors(id)
);