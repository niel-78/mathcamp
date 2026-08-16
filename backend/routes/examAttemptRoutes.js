import express from "express";
import db from "../db.js";
import crypto from "crypto";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { buildExamSession } from "../utils/buildExamSession.js";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher"));

/*
GET    /api/exam-attempts/:id


POST   /api/exam-attempts

PUT    /api/exam-attempts/:id

POST   /api/exam-attempts/join
POST   /api/exam-attempts/start
POST   /api/exam-attempts/:id/submit

GET    /api/exam-attempts/:id/results
*/

// GET /api/exam-attempts/:id
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
                ea.group_exam_id,
                ea.config,
                ea.started_at,
                ea.submitted_at,
                ea.status
            FROM assessment_attempts ea
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
                config: attempt.config
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

// PUT /api/exam-attempts/:id
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
                ON ge.id = ea.group_exam_id
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
                user_id,
                assessment_id,
                question_id,
                text_answer,
                attempt_id
            )
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                text_answer = VALUES(text_answer)
            `,
            [
                req.user.id,
                attempt.assessment_id,
                question_id,
                text_answer || null,
                id
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
                "Kunde inte spara svar."
        });

    } finally {

        connection.release();

    }

});

// POST /api/exam-attempts/start
router.post("/start", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { group_exam_id } = req.body;

        if (!group_exam_id) {
            return res.status(400).json({
                error: "group_exam_id saknas."
            });
        }

        await connection.beginTransaction();

        const [groupExamRows] = await connection.query(
            `
            SELECT
                id,
                assessment_id,
                group_id,
                exam_status,
                available_from,
                available_until,
                config
            FROM group_assessments
            WHERE id = ?
            `,
            [group_exam_id]
        );

        if (!groupExamRows.length) {

            await connection.rollback();

            return res.status(404).json({
                error: "Provtillfället hittades inte."
            });

        }

        const groupExam = groupExamRows[0];

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

        if (studentRows.length === 0) {

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
                    group_exam_id = ?
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
            groupExam.exam_status !== "open" &&
            !isAdmitted
        ) {

            await connection.rollback();

            return res.status(403).json({

                error:
                    groupExam.exam_status === "waiting"
                        ? "Provet har inte startat ännu."
                        : "Provet är stängt."

            });

        }


        if (
            groupExam.available_from &&
            now < new Date(groupExam.available_from)
        ) {

            await connection.rollback();

            return res.status(403).json({
                error: "Provet har inte öppnat ännu."
            });
        }

        if (
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
                WHERE group_exam_id = ?
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
                        group_exam_id = ?
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
                        group_exam_id = ?
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
                    group_exam_id,
                    config,
                    started_at,
                    started_ip,
                    started_user_agent,
                    status
                )
                VALUES (
                    ?, ?, ?, ?, NOW(), ?, ?, 'in_progress'
                )
            `,
            [
                attemptId,
                req.user.id,
                groupExam.id,
                groupExam.config,
                startedIp,
                startedUserAgent
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

        const session =
            await buildExamSession(
                connection,
                groupExam.id
            );

        await connection.query(
            `
            DELETE
            FROM assessment_waiting_room
            WHERE
                group_exam_id = ?
                AND user_id = ?
            `,
            [
                groupExam.id,
                req.user.id
            ]
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


// POST /api/exam-attempts/:id/submit
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
                    group_exam_id,
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
            WHERE group_exam_id = ?
                AND user_id = ?
            `,
            [
                attempt.group_exam_id,
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


// POST /api/exam-attempts/:id/terminate
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

// POST /api/exam-attempts/:id/resume
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

// GET /api/exam-attempts/:id/results
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
            return res.status(403).json({
                error: "Saknar behörighet."
            });
        }

        const [questions] =
            await connection.query(
                `
                SELECT
                    q.id,
                    q.question,
                    q.question_type,
                    q.answer_config,
                    a.id AS answer_id,
                    a.text_answer
                FROM assessment_answers a
                INNER JOIN questions q
                    ON q.id = a.question_id
                INNER JOIN attempt_questions aq
                    ON aq.question_id = q.id
                    AND aq.attempt_id = a.attempt_id
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


export default router
