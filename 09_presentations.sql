USE mydb;

/* =====================================================
   PRESENTATIONS
   ===================================================== */

CREATE TABLE presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    content LONGTEXT NOT NULL,

    section_id INT NULL,

    school_id INT NOT NULL,

    visibility ENUM(
        'private',
        'school',
        'global'
    ) NOT NULL DEFAULT 'private',

    archived_at DATETIME NULL,

    deleted_at DATETIME NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    FOREIGN KEY (section_id)
        REFERENCES sections(id)
        ON DELETE SET NULL,

    FOREIGN KEY (school_id)
        REFERENCES schools(id),

    FOREIGN KEY (created_by)
        REFERENCES users(id),

    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);

/* =====================================================
   PRESENTATION PERMISSIONS
   ===================================================== */

CREATE TABLE presentation_permissions (
    presentation_id INT NOT NULL,

    user_id INT NOT NULL,

    role ENUM(
        'owner',
        'editor',
        'reader'
    ) NOT NULL,

    PRIMARY KEY (
        presentation_id,
        user_id
    ),

    FOREIGN KEY (presentation_id)
        REFERENCES presentations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);