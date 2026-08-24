USE mydb;

INSERT INTO schools (
    id,
    name
)
VALUES (1,'DBGY HALMSTAD');

INSERT INTO users (id, username, password_hash, first_name, last_name, role)
VALUES
(1, 'niklas', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas', 'Elofsson' , 'teacher'),
(2, 'waitingforsuperman', '$2a$12$gjIfWb/g7c/4ejxERnt/7eAeTepdhlg1G.8qYjOzbqCkhpdpztTyC', 'Niklas', 'Elofsson' , 'super');


INSERT INTO subjects (
    id,
    code,
    name
)
VALUES (
    1,
    'MAT',
    'Matematik'
);

INSERT INTO app_settings (
    id,
    settings
)
VALUES (
    1,
    JSON_OBJECT(
        'first_question_in_block_can_be_deleted', FALSE,
        'default_auto_logout_minutes', 15,
        'student_auto_logout_minutes', 30,
        'assessment_auto_logout_minutes', 10
    )
);

INSERT INTO school_teachers (
    school_id,
    teacher_id,
    is_admin
)
VALUES
    (1, 1, true);

INSERT INTO assessment_type_settings (
    assessment_type,
    config
)
VALUES

(
    'exam',
    JSON_OBJECT(
        'attempt', JSON_OBJECT(
            'defaultTimeLimitMinutes', 120,
            'maxAttempts', 1
        ),

        'presentation', JSON_OBJECT(
            'allowCalculator', false,
            'allowFormulaSheet', true
        ),

        'monitoring', JSON_OBJECT(
            'lock_page_refresh', true,
            'lock_tab_hidden', true,
            'lock_window_blur', true,
            'lock_context_menu', true,
            'lock_page_unload', false
        ),

        'navigation', JSON_OBJECT(
            'allowGoToPreviousQuestion', true
        )
    )
),

(
    'worksheet',
    JSON_OBJECT(
        'attempt', JSON_OBJECT(
            'defaultTimeLimitMinutes', NULL,
            'maxAttempts', 999
        ),

        'presentation', JSON_OBJECT(
            'allowCalculator', true,
            'allowFormulaSheet', true
        ),

        'monitoring', JSON_OBJECT(),

        'navigation', JSON_OBJECT(
            'allowGoToPreviousQuestion', true
        )
    )
),

(
    'exit_ticket',
    JSON_OBJECT(
        'attempt', JSON_OBJECT(
            'defaultTimeLimitMinutes', 10,
            'maxAttempts', 1
        ),

        'presentation', JSON_OBJECT(
            'allowCalculator', false,
            'allowFormulaSheet', false
        ),

        'monitoring', JSON_OBJECT(),

        'navigation', JSON_OBJECT(
            'allowGoToPreviousQuestion', false
        )
    )
),

(
    'diagnostic',
    JSON_OBJECT(
        'attempt', JSON_OBJECT(
            'defaultTimeLimitMinutes', 60,
            'maxAttempts', 1
        ),

        'presentation', JSON_OBJECT(
            'allowCalculator', true,
            'allowFormulaSheet', true
        ),

        'monitoring', JSON_OBJECT(),

        'navigation', JSON_OBJECT(
            'allowGoToPreviousQuestion', true
        )
    )
);