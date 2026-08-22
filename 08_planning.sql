USE mydb;

/* =====================================================
   GROUP SCHEDULES
   ===================================================== */

CREATE TABLE group_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    weekday TINYINT NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,

    FOREIGN KEY (group_id)
        REFERENCES `groups`(id)
        ON DELETE CASCADE
);

/* =====================================================
   SCHOOL SCHEDULE EXCEPTIONS
   ===================================================== */

CREATE TABLE school_schedule_exceptions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    school_id INT NOT NULL,

    date DATE NOT NULL,

    type ENUM(
        'holiday',
        'study_day',
        'cancelled',
        'other'
    ) NOT NULL,

    note VARCHAR(255),

    affects_lessons BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, date),

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

/* =====================================================
   LESSONS
   ===================================================== */

CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    group_schedule_id INT NOT NULL,

    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,

    cancelled_at DATETIME NULL,
    deleted_at DATETIME NULL,

    FOREIGN KEY (group_id)
        REFERENCES `groups`(id)
        ON DELETE CASCADE,

    FOREIGN KEY (group_schedule_id)
        REFERENCES group_schedules(id)
        ON DELETE CASCADE
);

/* =====================================================
   LESSON SECTIONS
   ===================================================== */

CREATE TABLE lesson_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,

    lesson_id INT NOT NULL,

    section_id INT NOT NULL,

    pinned TINYINT(1) NOT NULL DEFAULT 0,

    sort_order INT NOT NULL DEFAULT 0,

    FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    FOREIGN KEY (section_id)
        REFERENCES sections(id)
        ON DELETE CASCADE
);

/* =====================================================
   GROUP PLANNING SECTIONS
   ===================================================== */

CREATE TABLE group_planning_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    section_id INT NOT NULL,

    sort_order INT NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES `groups`(id),

    FOREIGN KEY (section_id)
        REFERENCES sections(id)
);