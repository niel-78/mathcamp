USE mydb;

/* =====================================================
   BOOKS
   ===================================================== */

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    description TEXT
);

/* =====================================================
   CHAPTERS
   ===================================================== */

CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,

    book_id INT NOT NULL,

    chapter_number VARCHAR(20),

    title VARCHAR(255) NOT NULL,

    sort_order INT NOT NULL,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
);

/* =====================================================
   SUBCHAPTERS
   ===================================================== */

CREATE TABLE subchapters (
    id INT AUTO_INCREMENT PRIMARY KEY,

    chapter_id INT NOT NULL,

    subchapter_number VARCHAR(20),

    title VARCHAR(255) NOT NULL,

    sort_order INT NOT NULL,

    FOREIGN KEY (chapter_id)
        REFERENCES chapters(id)
);

/* =====================================================
   SECTIONS
   ===================================================== */

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,

    subchapter_id INT NOT NULL,

    title VARCHAR(255) NOT NULL,

    content LONGTEXT NULL,

    included_by_default BOOLEAN NOT NULL DEFAULT TRUE,

    page_number INT,

    sort_order INT NOT NULL,

    FOREIGN KEY (subchapter_id)
        REFERENCES subchapters(id)
);

/* =====================================================
   LEVEL BOOKS
   ===================================================== */

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