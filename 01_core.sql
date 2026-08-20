USE mydb;

/* =====================================================
   SCHOOLS
   ===================================================== */

CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);

/* =====================================================
   USERS
   ===================================================== */

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100)
        UNIQUE NOT NULL,

    password_hash VARCHAR(255)
        NOT NULL,

    role ENUM(
        'student',
        'teacher',
        'super'
    ) NOT NULL DEFAULT 'student',

    first_name VARCHAR(255),
    last_name VARCHAR(255),

    deleted_at DATETIME NULL,

    user_key VARCHAR(100)
        UNIQUE,

    last_login DATETIME,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

/* =====================================================
   USER SESSIONS
   ===================================================== */

CREATE TABLE user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    session_token VARCHAR(255)
        NOT NULL,

    logged_in_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    logged_out_at DATETIME NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX(user_id),
    INDEX(session_token)

) ENGINE=InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

/* =====================================================
   USER SETTINGS
   ===================================================== */

CREATE TABLE user_settings (

    user_id INT PRIMARY KEY,

    settings JSON NOT NULL,

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

/* =====================================================
   SCHOOL SETTINGS
   ===================================================== */

CREATE TABLE school_settings (

    school_id INT PRIMARY KEY,

    enable_assessment_templates
        BOOLEAN NOT NULL DEFAULT TRUE,

    enable_block_copying
        BOOLEAN NOT NULL DEFAULT TRUE,

    default_shared_blocks
        BOOLEAN NOT NULL DEFAULT TRUE,

    default_shared_assessments
        BOOLEAN NOT NULL DEFAULT TRUE,

    enable_global_blocks
        BOOLEAN NOT NULL DEFAULT TRUE,

    settings JSON NULL,

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE

);

/* =====================================================
   SCHOOL TEACHERS
   ===================================================== */

CREATE TABLE school_teachers (

    school_id INT NOT NULL,

    teacher_id INT NOT NULL UNIQUE,

    is_admin BOOLEAN NOT NULL
        DEFAULT FALSE,

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE,

    FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

/* =====================================================
   APP SETTINGS
   ===================================================== */

CREATE TABLE app_settings (

    id INT PRIMARY KEY,

    settings JSON NOT NULL

);

/* =====================================================
   SYSTEM ERRORS
   ===================================================== */


CREATE TABLE system_errors (

    id INT AUTO_INCREMENT PRIMARY KEY,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    user_id INT NULL,

    school_id INT NULL,

    source VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    stacktrace LONGTEXT NULL,

    context JSON NULL,

    resolved BOOLEAN NOT NULL
        DEFAULT FALSE

);