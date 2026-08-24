USE mydb;

SET FOREIGN_KEY_CHECKS = 0;

/* =====================================================
   SETTINGS
   ===================================================== */

DROP TABLE IF EXISTS assessment_type_settings;
DROP TABLE IF EXISTS system_errors;

/* =====================================================
   SETTINGS
   ===================================================== */

DROP TABLE IF EXISTS assessment_type_settings;

/* =====================================================
   CLASSROOMS
   ===================================================== */

DROP TABLE IF EXISTS group_layout_snapshot_items;
DROP TABLE IF EXISTS group_layout_snapshots;
DROP TABLE IF EXISTS assessment_seat_assignments;
DROP TABLE IF EXISTS lesson_seat_assignments;

DROP TABLE IF EXISTS group_seat_assignment_history;
DROP TABLE IF EXISTS group_seat_assignments;

DROP TABLE IF EXISTS classroom_seats;
DROP TABLE IF EXISTS classroom_layouts;
DROP TABLE IF EXISTS classrooms;


/* =====================================================
   CONTACTS
   ===================================================== */

DROP TABLE IF EXISTS group_contact_links;
DROP TABLE IF EXISTS group_contacts;
DROP TABLE IF EXISTS student_contact_links;
DROP TABLE IF EXISTS student_contacts;

/* =====================================================
   PRESENTATIONS
   ===================================================== */

DROP TABLE IF EXISTS presentation_permissions;
DROP TABLE IF EXISTS presentations;

/* =====================================================
   PLANNING
   ===================================================== */

DROP TABLE IF EXISTS lesson_sections;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS school_schedule_exceptions;
DROP TABLE IF EXISTS group_schedules;
DROP TABLE IF EXISTS group_planning_sections;
DROP TABLE IF EXISTS schedule_exception_groups;

/* =====================================================
   ASSESSMENTS
   ===================================================== */

DROP TABLE IF EXISTS attempt_options;
DROP TABLE IF EXISTS attempt_questions;
DROP TABLE IF EXISTS answer_options;
DROP TABLE IF EXISTS assessment_answers;
DROP TABLE IF EXISTS assessment_events;
DROP TABLE IF EXISTS assessment_attempts;
DROP TABLE IF EXISTS assessment_waiting_room;
DROP TABLE IF EXISTS group_assessments;
DROP TABLE IF EXISTS assessment_blocks;
DROP TABLE IF EXISTS assessment_permissions;
DROP TABLE IF EXISTS assessments;


/* =====================================================
   PRESENTATIONS
   ===================================================== */

DROP TABLE IF EXISTS presentation_permissions;
DROP TABLE IF EXISTS presentations;

/* =====================================================
   PLANNING
   ===================================================== */

DROP TABLE IF EXISTS lesson_sections;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS school_schedule_exceptions;
DROP TABLE IF EXISTS group_schedules;
DROP TABLE IF EXISTS group_planning_sections;

/* =====================================================
   ASSESSMENTS
   ===================================================== */

DROP TABLE IF EXISTS attempt_options;
DROP TABLE IF EXISTS attempt_questions;
DROP TABLE IF EXISTS answer_options;
DROP TABLE IF EXISTS assessment_answers;
DROP TABLE IF EXISTS assessment_events;
DROP TABLE IF EXISTS assessment_attempts;
DROP TABLE IF EXISTS assessment_waiting_room;
DROP TABLE IF EXISTS group_assessments;
DROP TABLE IF EXISTS assessment_blocks;
DROP TABLE IF EXISTS assessment_permissions;
DROP TABLE IF EXISTS assessments;

/* =====================================================
   BLOCKS
   ===================================================== */

DROP TABLE IF EXISTS block_points;
DROP TABLE IF EXISTS block_abilities;
DROP TABLE IF EXISTS block_sections;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS question_media;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS question_levels;
DROP TABLE IF EXISTS blocks;

/* =====================================================
   ABILITIES
   ===================================================== */

DROP TABLE IF EXISTS ability_series_permissions;
DROP TABLE IF EXISTS abilities;
DROP TABLE IF EXISTS ability_series;

/* =====================================================
   BOOKS
   ===================================================== */

DROP TABLE IF EXISTS level_books;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS subchapters;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS books;

/* =====================================================
   SUBJECTS
   ===================================================== */

DROP TABLE IF EXISTS competency_descriptors;
DROP TABLE IF EXISTS central_content;
DROP TABLE IF EXISTS content_areas;
DROP TABLE IF EXISTS competencies;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS subjects;

/* =====================================================
   GROUPS
   ===================================================== */

DROP TABLE IF EXISTS group_students;
DROP TABLE IF EXISTS group_permissions;
DROP TABLE IF EXISTS `groups`;

/* =====================================================
   CORE
   ===================================================== */

DROP TABLE IF EXISTS school_teachers;
DROP TABLE IF EXISTS school_settings;

DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS user_sessions;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;

DROP TABLE IF EXISTS app_settings;

/* =====================================================
   LEGACY TABLES
   ===================================================== */

DROP TABLE IF EXISTS exam_attempts;
DROP TABLE IF EXISTS exam_blocks;
DROP TABLE IF EXISTS exam_events;
DROP TABLE IF EXISTS exam_permissions;
DROP TABLE IF EXISTS exam_teachers;
DROP TABLE IF EXISTS exam_waiting_room;
DROP TABLE IF EXISTS group_exams;
DROP TABLE IF EXISTS exams;

DROP TABLE IF EXISTS grading_abilities;
DROP TABLE IF EXISTS grading_ability_levels;

DROP TABLE IF EXISTS competency_levels;
DROP TABLE IF EXISTS level_competencies;

DROP TABLE IF EXISTS group_users;
DROP TABLE IF EXISTS student_groups;

DROP TABLE IF EXISTS block_book_sections;
DROP TABLE IF EXISTS block_central_content;
DROP TABLE IF EXISTS blocks_central_content;

DROP TABLE IF EXISTS answers;

SET FOREIGN_KEY_CHECKS = 1;