USE mydb;

/* =====================================================
   CONTACTS
   Vårdnadshavare och andra kontakter
   ===================================================== */

CREATE TABLE student_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NULL,

    relationship ENUM(
        'mother',
        'father',
        'guardian',
        'other'
    ) NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

/* =====================================================
   CONTACT ACCESS LINKS
   Delningslänkar för en specifik elev
   ===================================================== */

CREATE TABLE student_contact_links (
    id CHAR(36) PRIMARY KEY,

    contact_id INT NOT NULL,

    permissions JSON NOT NULL,

    expires_at DATETIME NULL,

    revoked_at DATETIME NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id)
        REFERENCES student_contacts(id)
        ON DELETE CASCADE
);

/* =====================================================
   GROUP CONTACTS
   Mentorer, assistenter, coacher etc.
   ===================================================== */

CREATE TABLE group_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NULL,

    relationship ENUM(
        'mentor',
        'assistant',
        'coach',
        'special_teacher',
        'other'
    ) NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

/* =====================================================
   GROUP ACCESS LINKS
   Delningslänkar för en hel grupp
   ===================================================== */

CREATE TABLE group_contact_links (
    id CHAR(36) PRIMARY KEY,

    contact_id INT NOT NULL,

    permissions JSON NOT NULL,

    expires_at DATETIME NULL,

    revoked_at DATETIME NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id)
        REFERENCES group_contacts(id)
        ON DELETE CASCADE
);