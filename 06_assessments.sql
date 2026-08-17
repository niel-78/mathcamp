USE mydb;

/* =====================================================
   ASSESSMENTS
   ===================================================== */

CREATE TABLE assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    type ENUM(
        'exam',
        'worksheet',
        'exit_ticket',
        'diagnostic'
    ) NOT NULL DEFAULT 'exam',

    title VARCHAR(255),

    subject_id INT NOT NULL,

    level_id INT NOT NULL,

    book_id INT NULL,

    status ENUM(
        'draft',
        'published',
        'archived'
    ) NOT NULL DEFAULT 'draft',

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    archived_at DATETIME NULL,

    deleted_at DATETIME NULL,

    config JSON DEFAULT JSON_OBJECT(
        'allowCalculator', false,
        'allowFormulaSheet', true,
        'defaultTimeLimitMinutes', 60000,
        'lock_tab_hidden', true,
        'lock_window_blur', true,
        'lock_context_menu', true,
        'lock_page_unload', false
    ),

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    FOREIGN KEY (level_id)
        REFERENCES levels(id),

    FOREIGN KEY (book_id)
        REFERENCES books(id),

    FOREIGN KEY (created_by)
        REFERENCES users(id),

    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);

/* =====================================================
   ASSESSMENT PERMISSIONS
   ===================================================== */

CREATE TABLE assessment_permissions (
    assessment_id INT NOT NULL,

    user_id INT NOT NULL,

    role ENUM(
        'owner',
        'editor',
        'reader'
    ) NOT NULL,

    PRIMARY KEY (
        assessment_id,
        user_id
    ),

    FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

/* =====================================================
   ASSESSMENT BLOCKS
   ===================================================== */

CREATE TABLE assessment_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,

    assessment_id INT NOT NULL,
    block_id INT NOT NULL,

    sort_order INT NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (assessment_id, block_id),

    CONSTRAINT fk_assessment_blocks_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assessment_blocks_block
        FOREIGN KEY (block_id)
        REFERENCES blocks(id)
        ON DELETE CASCADE

) ENGINE=InnoDB;

/* =====================================================
   GROUP ASSESSMENTS
   ===================================================== */

CREATE TABLE group_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    assessment_id INT NOT NULL,

    access_key VARCHAR(50) UNIQUE,

    status ENUM(
        'waiting',
        'open',
        'closed'
    ) NOT NULL DEFAULT 'waiting',

    available_from DATETIME NULL,

    available_until DATETIME NULL,

    config JSON DEFAULT JSON_OBJECT(

        'attempt', JSON_OBJECT(
            'defaultTimeLimitMinutes', 15,
            'maxAttempts', 1
        ),

        'presentation', JSON_OBJECT(
            'allowCalculator', false,
            'allowFormulaSheet', true
        ),

        'monitoring', JSON_OBJECT(
            'lock_page_refresh', true,
            'lock_tab_hidden', true,
            'lock_window_blur', true,
            'lock_context_menu', true,
            'lock_page_unload', false
        ),

        'navigation', JSON_OBJECT(
            'allowGoToPreviousQuestion', true
        ),

        'question_selection', JSON_OBJECT()
    ),

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    UNIQUE (
        group_id,
        assessment_id
    )
);

/* =====================================================
   WAITING ROOM
   ===================================================== */

CREATE TABLE assessment_waiting_room (

    group_assessment_id INT NOT NULL,

    user_id INT NOT NULL,

    joined_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    admitted_at DATETIME NULL,

    PRIMARY KEY (
        group_assessment_id,
        user_id
    ),

    FOREIGN KEY (
        group_assessment_id
    )
        REFERENCES group_assessments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (
        user_id
    )
        REFERENCES users(id)
        ON DELETE CASCADE
);

/* =====================================================
   ASSESSMENT ATTEMPTS
   ===================================================== */

CREATE TABLE assessment_attempts (
    id VARCHAR(36) PRIMARY KEY,

    user_id INT NOT NULL,

    group_assessment_id INT NOT NULL,

    started_ip VARCHAR(45) NULL,

    started_user_agent TEXT NULL,

    config JSON NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    started_at DATETIME NULL,

    submitted_at DATETIME NULL,

    status ENUM(
        'not_started',
        'in_progress',
        'submitted',
        'graded',
        'locked'
    ) DEFAULT 'not_started',

    UNIQUE (
        group_assessment_id,
        user_id
    ),

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (group_assessment_id)
        REFERENCES group_assessments(id)
        ON DELETE CASCADE
);

/* =====================================================
   ATTEMPT EVENTS
   ===================================================== */

CREATE TABLE assessment_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    attempt_id VARCHAR(36) NOT NULL,

    event_type VARCHAR(50) NOT NULL,

    event_data JSON NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    INDEX (attempt_id),

    FOREIGN KEY (attempt_id)
        REFERENCES assessment_attempts(id)
        ON DELETE CASCADE
);

/* =====================================================
   ANSWERS
   ===================================================== */

CREATE TABLE assessment_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    attempt_id VARCHAR(36) NOT NULL,

    question_id INT NOT NULL,

    text_answer TEXT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (attempt_id)
        REFERENCES assessment_attempts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (question_id)
        REFERENCES questions(id),

    UNIQUE (
        attempt_id,
        question_id
    )
);

/* =====================================================
   ANSWER OPTIONS
   ===================================================== */

CREATE TABLE answer_options (
    answer_id INT NOT NULL,

    option_id INT NOT NULL,

    PRIMARY KEY (
        answer_id,
        option_id
    ),

    FOREIGN KEY (answer_id)
        REFERENCES assessment_answers(id)
        ON DELETE CASCADE,

    FOREIGN KEY (option_id)
        REFERENCES options(id)
);

/* =====================================================
   ATTEMPT QUESTIONS
   ===================================================== */

CREATE TABLE attempt_questions (
    attempt_id VARCHAR(36) NOT NULL,

    question_id INT NOT NULL,

    sort_order INT,

    PRIMARY KEY (
        attempt_id,
        question_id
    ),

    FOREIGN KEY (attempt_id)
        REFERENCES assessment_attempts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (question_id)
        REFERENCES questions(id)
);

/* =====================================================
   ATTEMPT OPTIONS
   ===================================================== */

CREATE TABLE attempt_options (
    attempt_id VARCHAR(36) NOT NULL,

    option_id INT NOT NULL,

    sort_order INT NOT NULL,

    PRIMARY KEY (
        attempt_id,
        option_id
    ),

    FOREIGN KEY (attempt_id)
        REFERENCES assessment_attempts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (option_id)
        REFERENCES options(id)
        ON DELETE CASCADE
);