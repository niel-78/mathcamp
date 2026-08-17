USE mydb;

/* =====================================================
   ABILITY SERIES
   ===================================================== */

CREATE TABLE ability_series (
    id INT AUTO_INCREMENT PRIMARY KEY,

    subject_id INT NOT NULL,

    name VARCHAR(255) NOT NULL,

    visibility ENUM(
        'private',
        'school',
        'global'
    ) NOT NULL DEFAULT 'private',

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    FOREIGN KEY (created_by)
        REFERENCES users(id),

    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);

/* =====================================================
   ABILITIES
   ===================================================== */

CREATE TABLE abilities (
    id INT AUTO_INCREMENT PRIMARY KEY,

    series_id INT NOT NULL,

    name VARCHAR(255) NOT NULL,

    deleted_at DATETIME NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_by INT NOT NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    updated_by INT NOT NULL,

    FOREIGN KEY (series_id)
        REFERENCES ability_series(id)
        ON DELETE CASCADE,

    FOREIGN KEY (created_by)
        REFERENCES users(id),

    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);

/* =====================================================
   ABILITY SERIES PERMISSIONS
   ===================================================== */

CREATE TABLE ability_series_permissions (
    series_id INT NOT NULL,

    teacher_id INT NOT NULL,

    role ENUM(
        'owner',
        'editor',
        'reader'
    ) NOT NULL,

    PRIMARY KEY (
        series_id,
        teacher_id
    ),

    FOREIGN KEY (series_id)
        REFERENCES ability_series(id)
        ON DELETE CASCADE,

    FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);