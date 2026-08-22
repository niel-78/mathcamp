USE mydb;

/* =====================================================
   GROUPS
   ===================================================== */

CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    school_id INT NOT NULL,

    description TEXT,

    level_id INT NULL,

    book_id INT NULL,

    pages_per_lesson INT NULL DEFAULT 4,

    archived_at DATETIME NULL,

    deleted_at DATETIME NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id)
        REFERENCES schools(id),

    FOREIGN KEY (level_id)
        REFERENCES levels(id),

    FOREIGN KEY (book_id)
        REFERENCES books(id)
);

/* =====================================================
   GROUP PERMISSIONS
   ===================================================== */

CREATE TABLE group_permissions (
    group_id INT NOT NULL,

    user_id INT NOT NULL,

    role ENUM(
        'owner',
        'editor',
        'reader'
    ) NOT NULL,

    assigned_at DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        group_id,
        user_id
    ),

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

/* =====================================================
   GROUP STUDENTS
   ===================================================== */

CREATE TABLE group_students (
    user_id INT NOT NULL,

    group_id INT NOT NULL,

    joined_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    PRIMARY KEY (
        user_id,
        group_id
    ),

    CONSTRAINT fk_group_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_students_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);