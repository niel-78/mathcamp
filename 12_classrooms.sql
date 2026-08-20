USE mydb;

/* =====================================================
   CLASSROOMS
   ===================================================== */

CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,

    school_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

/* =====================================================
   CLASSROOM LAYOUTS
   Samma klassrum kan ha flera möbleringar
   ===================================================== */

CREATE TABLE classroom_layouts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    classroom_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,

    is_default BOOLEAN NOT NULL
        DEFAULT FALSE,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE CASCADE
);

/* =====================================================
   CLASSROOM SEATS
   Platser i en viss möblering
   ===================================================== */

CREATE TABLE classroom_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,

    layout_id INT NOT NULL,

    seat_label VARCHAR(20),

    seat_number INT NOT NULL,

    seat_row INT NULL,

    seat_column INT NULL,

    x_position DECIMAL(10,2) NULL,

    y_position DECIMAL(10,2) NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_layout_seat_number
    UNIQUE (
        layout_id,
        seat_number
    ),

    FOREIGN KEY (layout_id)
        REFERENCES classroom_layouts(id)
        ON DELETE CASCADE
);

/* =====================================================
   CURRENT GROUP SEATING
   Aktuell placering
   ===================================================== */

CREATE TABLE group_seat_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    student_id INT NOT NULL,

    classroom_seat_id INT,

    pinned TINYINT(1) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        group_id,
        student_id
    ),

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (classroom_seat_id)
        REFERENCES classroom_seats(id)
        ON DELETE CASCADE
);

/* =====================================================
   SEATING HISTORY
   Full historik
   ===================================================== */

CREATE TABLE group_seat_assignment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    student_id INT NOT NULL,

    classroom_seat_id INT NOT NULL,

    valid_from DATETIME NOT NULL,

    valid_to DATETIME NULL,

    created_by INT NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES groups(id),

    FOREIGN KEY (student_id)
        REFERENCES users(id),

    FOREIGN KEY (classroom_seat_id)
        REFERENCES classroom_seats(id),

    FOREIGN KEY (created_by)
        REFERENCES users(id)
);


/* =====================================================
   ASSESSMENT CLASSROOMS
   Varje grupp-prov kan få ett klassrum
   ===================================================== */

ALTER TABLE group_assessments
ADD COLUMN classroom_id INT NULL,
ADD CONSTRAINT fk_group_assessments_classroom
    FOREIGN KEY (classroom_id)
    REFERENCES classrooms(id);

ALTER TABLE group_assessments
ADD COLUMN classroom_layout_id INT NULL,
ADD CONSTRAINT fk_group_assessments_layout
    FOREIGN KEY (classroom_layout_id)
    REFERENCES classroom_layouts(id);

/* =====================================================
   GROUP SCHEDULE CLASSROOMS
   Schemaposter kan kopplas till klassrum
   och en specifik möblering
   ===================================================== */

ALTER TABLE group_schedules
ADD COLUMN classroom_id INT NULL,
ADD COLUMN classroom_layout_id INT NULL;

/* =====================================================
   FOREIGN KEYS
   ===================================================== */

ALTER TABLE group_schedules
ADD CONSTRAINT fk_group_schedules_classroom
    FOREIGN KEY (classroom_id)
    REFERENCES classrooms(id);

ALTER TABLE group_schedules
ADD CONSTRAINT fk_group_schedules_layout
    FOREIGN KEY (classroom_layout_id)
    REFERENCES classroom_layouts(id);

/* =====================================================
   LESSON SEATING SNAPSHOTS
   Historisk placering vid lektion
   ===================================================== */

CREATE TABLE lesson_seat_assignments (

    lesson_id INT NOT NULL,

    student_id INT NOT NULL,

    seat_number INT NOT NULL,

    PRIMARY KEY (
        lesson_id,
        student_id
    ),

    FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

/* =====================================================
   ASSESSMENT SEATING SNAPSHOTS
   Historisk placering vid prov
   ===================================================== */

CREATE TABLE assessment_seat_assignments (
    group_assessment_id INT NOT NULL,

    student_id INT NOT NULL,

    classroom_seat_id INT NOT NULL,

    PRIMARY KEY (
        group_assessment_id,
        student_id
    ),

    FOREIGN KEY (group_assessment_id)
        REFERENCES group_assessments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (classroom_seat_id)
        REFERENCES classroom_seats(id)
);

/* =====================================================
   ASSESSMENT SEATING SNAPSHOTS
   Historisk placering vid prov
   ===================================================== */

CREATE TABLE group_layout_snapshots (

    id INT AUTO_INCREMENT PRIMARY KEY,

    group_id INT NOT NULL,

    classroom_layout_id INT NOT NULL,

    name VARCHAR(255) NOT NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    FOREIGN KEY (classroom_layout_id)
        REFERENCES classroom_layouts(id)
        ON DELETE CASCADE

);

/* =====================================================
   group_layout_snapshot_items
   ===================================================== */

CREATE TABLE group_layout_snapshot_items (

    id INT AUTO_INCREMENT PRIMARY KEY,

    snapshot_id INT NOT NULL,

    student_id INT NOT NULL,

    seat_number INT NOT NULL,

    pinned TINYINT(1) NOT NULL DEFAULT 0,

    FOREIGN KEY (snapshot_id)
        REFERENCES group_layout_snapshots(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


/* =====================================================
   LESSON CLASSROOMS
   Varje lektion får ett klassrum
   ===================================================== */

ALTER TABLE lessons
ADD COLUMN classroom_id INT NULL;

ALTER TABLE lessons
ADD COLUMN classroom_layout_id INT NULL;

ALTER TABLE lessons
ADD CONSTRAINT fk_lessons_classroom
FOREIGN KEY (classroom_id)
REFERENCES classrooms(id)
ON DELETE SET NULL;

ALTER TABLE lessons
ADD CONSTRAINT fk_lessons_layout
FOREIGN KEY (classroom_layout_id)
REFERENCES classroom_layouts(id)
ON DELETE SET NULL;

