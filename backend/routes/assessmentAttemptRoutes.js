import express from "express";
import db from "../db.js";
import crypto from "crypto";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import AssessmentEngine from "../services/AssessmentEngine.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { buildExamSession } from "../utils/buildExamSession.js";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher"));

router.get("/:id", async (req, res) => {

    const connection = await db.getConnection();

    try {
        const { id } = req.params;

        /*
         * Hämta provförsöket
         */
        const [attemptRows] = await connection.query(
            `
            SELECT
                ea.id,
                ea.user_id,
                ea.group_assessment_id,
                ea.config,
                ea.started_at,
                ea.submitted_at,
                ea.status,

                a.id AS assessment_id,
                a.type AS assessment_type,
                a.title AS assessment_title,
                a.config AS assessment_config

            FROM assessment_attempts ea

            INNER JOIN group_assessments ga
                ON ga.id = ea.group_assessment_id

            INNER JOIN assessments a
                ON a.id = ga.assessment_id

            WHERE ea.id = ?
            `,
            [id]
        );

        if (attemptRows.length === 0) {
            return res.status(404).json({
                error: "Provförsöket hittades inte."
            });
        }

        const attempt = attemptRows[0];

        /*
         * Säkerställ att eleven bara kan läsa sitt eget försök
         */
        if (attempt.user_id !== req.user.id) {
            return res.status(403).json({
                error: "Åtkomst nekad."
            });
        }

        /*
        * Hämta frågorna i rätt ordning
        */
        const [questions] = await connection.query(
            `
            SELECT
                aq.sort_order,
                q.*
            FROM attempt_questions aq
            INNER JOIN questions q
                ON q.id = aq.question_id
            WHERE aq.attempt_id = ?
            ORDER BY aq.sort_order
            `,
            [id]
        );

        /*
        * Hämta alternativ för alla frågor
        */
        const questionIds = questions.map(q => q.id);

        let options = [];

        if (questionIds.length > 0) {
            const [optionRows] = await connection.query(
                `
                SELECT
                    o.id,
                    o.question_id,
                    o.text,
                    ao.sort_order
                FROM attempt_options ao
                INNER JOIN options o
                    ON o.id = ao.option_id
                WHERE ao.attempt_id = ?
                ORDER BY ao.sort_order
                `,
                [id]
            );

            options = optionRows;
        }

        /*
        * Lägg options på respektive fråga
        */
        const questionsWithOptions = questions.map(question => ({
            ...question,
            options: options.filter(
                option => option.question_id === question.id
            )
        }));

        res.json({
            attempt: {
                id: attempt.id,
                status: attempt.status,
                started_at: attempt.started_at,
                submitted_at: attempt.submitted_at,
                config: attempt.config,

                assessment: {
                    id: attempt.assessment_id,
                    type: attempt.assessment_type,
                    title: attempt.assessment_title,
                    config:
                        typeof attempt.assessment_config === "string"
                            ? JSON.parse(
                                attempt.assessment_config
                            )
                            : attempt.assessment_config
                }
            },
            questions: questionsWithOptions
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Kunde inte hämta provförsöket."
        });
    } finally {
        connection.release();
    }
});

// PUT /api/assessment-attempts/:id
router.put("/:id", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { id } = req.params;

        const {
            question_id,
            text_answer,
            selected_option_ids = []
        } = req.body;

        await connection.beginTransaction();

        /*
         * Kontrollera att försöket tillhör användaren
         */
        const [attemptRows] = await connection.query(
            `
            SELECT
                ea.*,
                ge.assessment_id
            FROM assessment_attempts ea
            INNER JOIN group_assessments ge
                ON ge.id = ea.group_assessment_id
            WHERE ea.id = ?
                AND ea.user_id = ?
            `,
            [
                id,
                req.user.id
            ]
        );

        if (attemptRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                error: "Provförsöket hittades inte."
            });
        }

        const attempt = attemptRows[0];

        if (attempt.status !== "in_progress") {

            await connection.rollback();

            return res.status(400).json({
                error: "Provet kan inte längre ändras."
            });
        }

        /*
         * Säkerställ att frågan ingår i försöket
         */
        const [questionRows] = await connection.query(
            `
            SELECT 1
            FROM attempt_questions
            WHERE attempt_id = ?
                AND question_id = ?
            `,
            [
                id,
                question_id
            ]
        );

        if (questionRows.length === 0) {

            await connection.rollback();

            return res.status(400).json({
                error: "Ogiltig fråga."
            });
        }

        /*
         * Upsert answer
         */
        await connection.query(
            `
            INSERT INTO assessment_answers (
                attempt_id,
                question_id,
                text_answer
            )
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                text_answer = VALUES(text_answer)
            `,
            [
                id,
                question_id,
                text_answer || null
            ]
        );

        /*
         * Hämta answer-id
         */
        const [answerRows] = await connection.query(
            `
            SELECT id
            FROM assessment_answers
            WHERE attempt_id = ?
                AND question_id = ?
            `,
            [
                id,
                question_id
            ]
        );

        const answerId = answerRows[0].id;

        /*
         * Ersätt alla tidigare val
         */
        await connection.query(
            `
            DELETE FROM answer_options
            WHERE answer_id = ?
            `,
            [answerId]
        );

        /*
         * Spara nya val
         */
        if (
            Array.isArray(selected_option_ids) &&
            selected_option_ids.length > 0
        ) {

            const values = selected_option_ids.map(
                optionId => [
                    answerId,
                    optionId
                ]
            );

            await connection.query(
                `
                INSERT INTO answer_options (
                    answer_id,
                    option_id
                )
                VALUES ?
                `,
                [values]
            );
        }

        let nextQuestion = null;
        let evaluation = null;

        const [[assessment]] =
            await connection.query(
                `
                SELECT a.*
                FROM assessments a

                INNER JOIN group_assessments ga
                    ON ga.assessment_id = a.id

                WHERE ga.id = ?
                `,
                [attempt.group_assessment_id]
            );

        if (assessment.type === "diagnostic") {

            evaluation =
                await AssessmentEngine
                    .evaluateAnswer(
                        connection,
                        attempt.id,
                        question_id
                    );

            nextQuestion =
                await AssessmentEngine
                    .getNextQuestion(
                        connection,
                        attempt.id
                    );

            if (nextQuestion) {

                const [[maxOrder]] =
                    await connection.query(
                        `
                        SELECT
                            MAX(sort_order) AS value
                        FROM attempt_questions
                        WHERE attempt_id = ?
                        `,
                        [attempt.id]
                    );

                const nextOrder =
                    (maxOrder?.value || 0) + 1;

                await connection.query(
                    `
                    INSERT INTO attempt_questions (
                        attempt_id,
                        question_id,
                        sort_order
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        attempt.id,
                        nextQuestion.id,
                        nextOrder
                    ]
                );

                const [options] =
                    await connection.query(
                        `
                        SELECT *
                        FROM options
                        WHERE question_id = ?
                        ORDER BY RAND()
                        `,
                        [nextQuestion.id]
                    );

                nextQuestion.options = options;

                for (let i = 0; i < options.length; i++) {

                    await connection.query(
                        `
                        INSERT INTO attempt_options (
                            attempt_id,
                            option_id,
                            sort_order
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            attempt.id,
                            options[i].id,
                            i + 1
                        ]
                    );

                }

            }

        }

        await connection.commit();

        res.json({
            success: true,
            correct: evaluation?.correct,
            nextQuestion
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Kunde inte spara svar."
        });

    } finally {

        connection.release();

    }

});

// POST /api/assessment-attempts/start
router.post("/start", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { group_assessment_id } = req.body;

        if (!group_assessment_id) {
            return res.status(400).json({
                error: "group_assessment_id saknas."
            });
        }

        await connection.beginTransaction();

        const [groupExamRows] = await connection.query(
            `
            SELECT
                id,
                assessment_id,
                group_id,
                status,
                mode,
                available_from,
                available_until,
                config
            FROM group_assessments
            WHERE id = ?
            `,
            [group_assessment_id]
        );

        if (!groupExamRows.length) {

            await connection.rollback();

            return res.status(404).json({
                error: "Provtillfället hittades inte."
            });

        }

        const groupExam = groupExamRows[0];

        const isTest =
            groupExam.mode === "test";

        /*
         * Kontrollera att eleven tillhör gruppen
         */
        const [studentRows] = await connection.query(
            `
            SELECT *
            FROM group_students
            WHERE group_id = ?
                AND user_id = ?
            `,
            [
                groupExam.group_id,
                req.user.id
            ]
        );

        const isTeacher =
            req.user.role === "teacher";

        if (
            studentRows.length === 0 &&
            !isTeacher
        ) {

            await connection.rollback();

            return res.status(403).json({
                error: "Du tillhör inte gruppen."
            });

        }


        /*
        * Kontrollera om eleven blivit insläppt
        */
        const [[waitingRoom]] =
            await connection.query(
                `
                SELECT admitted_at
                FROM assessment_waiting_room
                WHERE
                    group_assessment_id = ?
                    AND user_id = ?
                `,
                [
                    groupExam.id,
                    req.user.id
                ]
            );

        const isAdmitted =
            !!waitingRoom?.admitted_at;

        /*
        * Kontrollera om provet är öppet
        */
        const now = new Date();

        if (
            !isTest &&
            groupExam.status !== "open" &&
            !isAdmitted
        ){

            await connection.rollback();

            return res.status(403).json({

                error:
                    groupExam.assessment_status === "waiting"
                        ? "Provet har inte startat ännu."
                        : "Provet är stängt."

            });

        }


        if (
            !isTest &&
            groupExam.available_from &&
            now < new Date(groupExam.available_from)
        ){

            await connection.rollback();

            return res.status(403).json({
                error: "Provet har inte öppnat ännu."
            });
        }

        if (
            !isTest &&
            groupExam.available_until &&
            now > new Date(groupExam.available_until)
        ) {

            await connection.rollback();

            return res.status(403).json({
                error: "Provtiden har gått ut."
            });
        }

        /*
         * Har eleven redan startat?
         */
        const [[attempt]] =
            await connection.query(
                `
                SELECT
                    id,
                    status,
                    started_ip
                FROM assessment_attempts
                WHERE group_assessment_id = ?
                    AND user_id = ?
                LIMIT 1
                `,
                [
                    groupExam.id,
                    req.user.id
                ]
            );

        if (attempt) {

            if (attempt.status === "in_progress") {

                const currentIp =
                    req.headers["x-forwarded-for"]
                        ?.split(",")[0]
                        ?.trim()
                    || req.socket.remoteAddress
                    || null;

                await connection.query(
                    `
                    DELETE
                    FROM assessment_waiting_room
                    WHERE
                        group_assessment_id = ?
                        AND user_id = ?
                    `,
                    [
                        groupExam.id,
                        req.user.id
                    ]
                );

                await connection.commit();

                return res.json({
                    attempt_id: attempt.id,
                    resume: true
                });

            }

            if (attempt.status === "locked") {

                await connection.query(
                    `
                    DELETE
                    FROM assessment_waiting_room
                    WHERE
                        group_assessment_id = ?
                        AND user_id = ?
                    `,
                    [
                        groupExam.id,
                        req.user.id
                    ]
                );

                await connection.query(
                    `
                    INSERT INTO assessment_events (
                        attempt_id,
                        event_type
                    )
                    VALUES (?, ?)
                    `,
                    [
                        attempt.id,
                        "attempt_reopened_after_lock"
                    ]
                );

                await connection.commit();

                return res.json({
                    attempt_id: attempt.id,
                    status: "locked"
                });

            }

            if (attempt.status === "submitted") {

                await connection.commit();

                return res.status(409).json({
                    error: "Provet är redan inlämnat."
                });

            }

        }

        /*
         * Skapa provförsök
         */
        const attemptId = crypto.randomUUID();

        const startedIp =
            req.headers["x-forwarded-for"]
                ?.split(",")[0]
                ?.trim()
            || req.socket.remoteAddress
            || null;

        const startedUserAgent =
            req.headers["user-agent"]
            || null;

        await connection.query(
            `
                INSERT INTO assessment_attempts (
                    id,
                    user_id,
                    group_assessment_id,
                    config,
                    started_at,
                    started_ip,
                    started_user_agent,
                    status,
                    mode
                )
                VALUES (
                    ?, ?, ?, ?, NOW(), ?, ?, 'in_progress', ?
                )
            `,
            [
                attemptId,
                req.user.id,
                groupExam.id,
                JSON.stringify(groupExam.config || {}),
                startedIp,
                startedUserAgent,
                groupExam.mode
            ]
        );

        
        await connection.query(
            `
            INSERT INTO assessment_events (
                attempt_id,
                event_type
            )
            VALUES (?, ?)
            `,
            [
                attemptId,
                "attempt_started"
            ]
        );

        const [[assessment]] =
            await connection.query(
                `
                SELECT *
                FROM assessments
                WHERE id = ?
                `,
                [groupExam.assessment_id]
            );

        const config =
            typeof assessment.config === "string"
                ? JSON.parse(
                    assessment.config
                )
                : assessment.config || {};

        if (
            assessment.type ===
            "diagnostic"
        ) {

            const [[lessonLink]] =
                await connection.query(
                    `
                    SELECT lesson_id
                    FROM lesson_group_assessments
                    WHERE group_assessment_id = ?
                    `,
                    [groupExam.id]
                );

            if (!lessonLink) {
                throw new Error(
                    "Diagnosen saknar lektion."
                );
            }

            const seedQuestions =
                await AssessmentEngine
                    .getDiagnosticSeedQuestions(
                        lessonLink.lesson_id,
                        assessment.id,
                        groupExam.id
                    );

            for (let i = 0; i < seedQuestions.length; i++) {

                const question =
                    seedQuestions[i];

                await connection.query(
                    `
                    INSERT INTO attempt_questions (
                        attempt_id,
                        question_id,
                        sort_order
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        attemptId,
                        question.id,
                        i + 1
                    ]
                );

                const [options] =
                    await connection.query(
                        `
                        SELECT *
                        FROM options
                        WHERE question_id = ?
                        ORDER BY RAND()
                        `,
                        [question.id]
                    );

                for (
                    let j = 0;
                    j < options.length;
                    j++
                ) {

                    await connection.query(
                        `
                        INSERT INTO attempt_options (
                            attempt_id,
                            option_id,
                            sort_order
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            attemptId,
                            options[j].id,
                            j + 1
                        ]
                    );

                }

            }

        } else {

            const session =
                await buildExamSession(
                    connection,
                    groupExam.id
                );


            for (let i = 0; i < session.questions.length; i++) {

                const question =
                    session.questions[i];

                await connection.query(
                    `
                    INSERT INTO attempt_questions (
                        attempt_id,
                        question_id,
                        sort_order
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        attemptId,
                        question.id,
                        i + 1
                    ]
                );

                for (
                    let j = 0;
                    j < question.options.length;
                    j++
                ) {

                    const option =
                        question.options[j];

                    await connection.query(
                        `
                        INSERT INTO attempt_options (
                            attempt_id,
                            option_id,
                            sort_order
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            attemptId,
                            option.id,
                            j + 1
                        ]
                    );

                }

            }

        }
        
        await connection.query(
            `
            DELETE
            FROM assessment_waiting_room
            WHERE
                group_assessment_id = ?
                AND user_id = ?
            `,
            [
                groupExam.id,
                req.user.id
            ]
        );

        await connection.commit();

        res.json({
            attempt_id: attemptId,
            config: groupExam.config
        });

        } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Kunde inte starta provet."
        });

    } finally {

            connection.release();

        }
});

// POST /api/assessment-attempts/:id/submit
router.post("/:id/submit", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { id } = req.params;

        await connection.beginTransaction();

        const [attemptRows] =
            await connection.query(
                `
                SELECT
                    id,
                    user_id,
                    group_assessment_id,
                    status
                FROM assessment_attempts
                WHERE id = ?
                `,
                [id]
            );

        if (attemptRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                error: "Provförsöket hittades inte."
            });
        }

        const attempt = attemptRows[0];

        if (attempt.user_id !== req.user.id) {

            await connection.rollback();

            return res.status(403).json({
                error: "Saknar behörighet."
            });
        }

        if (attempt.status === "submitted") {

            await connection.rollback();

            return res.status(409).json({
                error: "Provet är redan inlämnat."
            });
        }

        await connection.query(
            `
            UPDATE assessment_attempts
            SET
                status = 'submitted',
                submitted_at = NOW()
            WHERE id = ?
            `,
            [id]
        );

        await connection.query(
            `
            DELETE
            FROM assessment_waiting_room
            WHERE group_assessment_id = ?
                AND user_id = ?
            `,
            [
                attempt.group_assessment_id,
                attempt.user_id
            ]
        );

        await connection.commit();

        res.json({
            success: true
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Kunde inte lämna in provet."
        });

    } finally {

        connection.release();
    }
});

// POST /api/assessment-attempts/:id/terminate
router.post("/:id/terminate",
    async (req, res) => {

        const attemptId =
            req.params.id;

        await db.query(
            `
            UPDATE assessment_attempts
            SET
                status = 'submitted',
                submitted_at = NOW()
            WHERE id = ?
            `,
            [attemptId]
        );

        const [check] = await db.query(
            `
            SELECT
                id,
                status,
                submitted_at
            FROM assessment_attempts
            WHERE id = ?
            `,
            [attemptId]
        );

        res.json({
            success: true
        });

        await db.query(
            `
            INSERT INTO assessment_events (
                attempt_id,
                event_type
            )
            VALUES (?, ?)
            `,
            [
                attemptId,
                "terminated_by_teacher"
            ]
        );

    }
);

// POST /api/assessment-attempts/:id/resume
router.post("/:id/resume", async (req, res) => {

    const [[attempt]] =
        await db.query(
            `
            SELECT *
            FROM assessment_attempts
            WHERE id = ?
            `,
            [req.params.id]
        );

    if (!attempt) {

        return res.status(404).json({
            error: "Provtillfället hittades inte."
        });

    }

    if (
        attempt.status !== "submitted" &&
        attempt.status !== "locked"
    ) {

        return res.status(400).json({
            error: "Provet kan inte återupptas."
        });

    }

    await db.query(
        `
        UPDATE assessment_attempts
        SET status = 'in_progress'
        WHERE id = ?
        `,
        [req.params.id]
    );

    await db.query(
        `
        INSERT INTO assessment_events (
            attempt_id,
            event_type
        )
        VALUES (?, ?)
        `,
        [
            req.params.id,

            attempt.status === "locked"
                ? "unlocked_by_teacher"
                : "resumed_by_teacher"
        ]
    );

    res.sendStatus(204);

});

// GET /api/assessment-attempts/:id/results
router.get("/:id/results", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { id } = req.params;

        const [attemptRows] =
            await connection.query(
                `
                SELECT
                    id,
                    user_id
                FROM assessment_attempts
                WHERE id = ?
                `,
                [id]
            );

        if (attemptRows.length === 0) {
            return res.status(404).json({
                error: "Provförsök hittades inte."
            });
        }

        const attempt = attemptRows[0];

        if (attempt.user_id !== req.user.id) {

            const [teacherAccess] =
                await connection.query(
                    `
                    SELECT 1
                    FROM group_assessments ga
                    INNER JOIN group_permissions gp
                        ON gp.group_id = ga.group_id
                    WHERE ga.id = (
                        SELECT group_assessment_id
                        FROM assessment_attempts
                        WHERE id = ?
                    )
                        AND gp.user_id = ?
                    `,
                    [id, req.user.id]
                );

            if (
                req.user.role !== "teacher" ||
                teacherAccess.length === 0
            ) {
                return res.status(403).json({
                    error: "Saknar behörighet."
                });
            }
        }

        const [questions] =
            await connection.query(
                `
                SELECT
                    q.id,
                    q.question,
                    q.question_type,
                    q.answer_config,
                    COALESCE(
                        series_level.name,
                        ql.name,
                        assessment_level.name
                    ) AS level_name,
                    (
                        SELECT GROUP_CONCAT(
                            s.title
                            ORDER BY s.title
                            SEPARATOR ', '
                        )
                        FROM block_sections bs
                        INNER JOIN sections s
                            ON s.id = bs.section_id
                        WHERE bs.block_id = q.block_id
                    ) AS section_names,
                    (
                        SELECT GROUP_CONCAT(
                            ab.name
                            ORDER BY ab.name
                            SEPARATOR ', '
                        )
                        FROM block_abilities ba
                        INNER JOIN abilities ab
                            ON ab.id = ba.ability_id
                        WHERE ba.block_id = q.block_id
                    ) AS ability_names,
                    a.id AS answer_id,
                    a.text_answer
                FROM assessment_answers a
                INNER JOIN questions q
                    ON q.id = a.question_id
                INNER JOIN attempt_questions aq
                    ON aq.question_id = q.id
                    AND aq.attempt_id = a.attempt_id
                INNER JOIN assessment_attempts ea
                    ON ea.id = a.attempt_id
                INNER JOIN group_assessments ga
                    ON ga.id = ea.group_assessment_id
                INNER JOIN assessments assessment
                    ON assessment.id = ga.assessment_id
                LEFT JOIN question_levels ql
                    ON ql.id = q.level_id
                LEFT JOIN ability_series_levels series_level
                    ON series_level.id = q.series_level_id
                LEFT JOIN levels assessment_level
                    ON assessment_level.id = assessment.level_id
                WHERE a.attempt_id = ?
                ORDER BY aq.sort_order
                `,
                [id]
            );

        const results = [];

        for (const question of questions) {

            const [selectedOptions] =
                await connection.query(
                    `
                    SELECT
                        o.id,
                        o.text
                    FROM answer_options ao
                    INNER JOIN options o
                        ON o.id = ao.option_id
                    WHERE ao.answer_id = ?
                    ORDER BY o.id
                    `,
                    [question.answer_id]
                );

            question.answer_config =
                typeof question.answer_config === "string"
                    ? JSON.parse(question.answer_config)
                    : question.answer_config;

            const [correctOptions] =
                await connection.query(
                    `
                    SELECT
                        id,
                        text
                    FROM options
                    WHERE question_id = ?
                        AND is_correct = 1
                    ORDER BY id
                    `,
                    [question.id]
                );

            let correct = false;
    
            if (question.question_type === "text") {

                correct =
                    gradeAnswer({
                        studentAnswer:
                            question.text_answer,
                        correctAnswer:
                            correctOptions[0]?.text,
                        config:
                            question.answer_config
                    });

            } else {

                const selectedIds =
                    selectedOptions
                        .map(o => o.id)
                        .sort((a, b) => a - b);

                const correctIds =
                    correctOptions
                        .map(o => o.id)
                        .sort((a, b) => a - b);

                correct =
                    JSON.stringify(selectedIds) ===
                    JSON.stringify(correctIds);
            }

            results.push({
                question_id: question.id,
                question: question.question,
                question_type: question.question_type,
                section_names: question.section_names,
                level_name: question.level_name,
                ability_names: question.ability_names,
                text_answer: question.text_answer,
                selected_options: selectedOptions,
                correct_options: correctOptions,
                correct
            });
        }

        res.json({
            results
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Kunde inte hämta resultat."
        });

    } finally {

        connection.release();
    }
});

// POST /api/assessment-attempts/:id/next-question
router.post("/:id/next-question",
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const question =
                await AssessmentEngine
                    .getNextQuestion(
                        connection,
                        req.params.id
                    );

            if (!question) {

                return res.json({
                    question: null
                });

            }

            const [[maxOrder]] =
                await connection.query(
                    `
                    SELECT
                        MAX(sort_order) AS value
                    FROM attempt_questions
                    WHERE attempt_id = ?
                    `,
                    [req.params.id]
                );

            const nextOrder =
                (maxOrder?.value || 0) + 1;

            await connection.query(
                `
                INSERT INTO attempt_questions (
                    attempt_id,
                    question_id,
                    sort_order
                )
                VALUES (?, ?, ?)
                `,
                [
                    req.params.id,
                    question.id,
                    nextOrder
                ]
            );

            res.json({
                question,
                sort_order:
                    nextOrder
            });

        } finally {

            connection.release();

        }

    }
);

// GET /api/assessment-attempts/:id/status
router.get("/:id/status", async (req, res) => {

    const [[attempt]] =
        await db.query(
            `
            SELECT
                id,
                status,
                submitted_at
            FROM assessment_attempts
            WHERE id = ?
            `,
            [req.params.id]
        );

    if (!attempt) {

        return res.status(404).json({
            error: "Provförsöket hittades inte."
        });

    }

    res.json({
        status: attempt.status,
        submitted_at: attempt.submitted_at
    });

});

export default router
