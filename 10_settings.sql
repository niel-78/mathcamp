USE mydb;

/* =====================================================
   ASSESSMENT TYPE SETTINGS
   ===================================================== */

CREATE TABLE assessment_type_settings (
    assessment_type VARCHAR(50) PRIMARY KEY,

    config JSON NOT NULL
);