import express from "express";
import db from "../db.js";
import crypto from "crypto";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher", "admin"));

/*
GET    /api/exam-attempts/:id


POST   /api/exam-attempts

PUT    /api/exam-attempts/:id

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
                ea.exam_config,
                ea.started_at,
                ea.submitted_at,
                ea.status
            FROM exam_attempts ea
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
                    id,
                    question_id,
                    text
                FROM options
                WHERE question_id IN (?)
                AND deleted_at IS NULL
                `,
                [questionIds]
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
                exam_config: attempt.exam_config
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
                ge.exam_id
            FROM exam_attempts ea
            INNER JOIN group_exams ge
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
            INSERT INTO answers (
                user_id,
                exam_id,
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
                attempt.exam_id,
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
            FROM answers
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

    console.log("START ROUTE HIT");

    const connection = await db.getConnection();

    try {

        const { group_exam_key } = req.body;

        if (!group_exam_key) {
            return res.status(400).json({
                error: "Exam key saknas."
            });
        }

        await connection.beginTransaction();

        /*
         * Hitta grupprovet
         */
        const [groupExamRows] = await connection.query(
            `
            SELECT
                ge.id,
                ge.exam_id,
                ge.group_id,
                ge.group_exam_key,
                ge.is_open,
                ge.available_from,
                ge.available_until,
                ge.shuffle_questions,
                ge.shuffle_options,
                ge.time_limit_minutes,
                ge.exam_config
            FROM group_exams ge
            INNER JOIN exams e
                ON e.id = ge.exam_id
            WHERE ge.group_exam_key = ?
            `,
            [group_exam_key]
        );

        if (groupExamRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                error: "Ogiltig exam key."
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
         * Kontrollera om provet är öppet
         */
        const now = new Date();

        if (!groupExam.is_open) {

            await connection.rollback();

            return res.status(403).json({
                error: "Provet är inte öppet."
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
        const [existingAttempts] = await connection.query(
            `
            SELECT
                id,
                status
            FROM exam_attempts
            WHERE group_exam_id = ?
                AND user_id = ?
            `,
            [
                groupExam.id,
                req.user.id
            ]
        );

        if (existingAttempts.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                error: "Du har redan startat provet."
            });
        }

        /*
         * Skapa provförsök
         */
        const attemptId = crypto.randomUUID();

        await connection.query(
            `
            INSERT INTO exam_attempts (
                id,
                user_id,
                group_exam_id,
                exam_config,
                started_at,
                status
            )
            VALUES (
                ?, ?, ?, ?, NOW(), 'in_progress'
            )
            `,
            [
                attemptId,
                req.user.id,
                groupExam.id,
                groupExam.exam_config
            ]
        );

        /*
         * Hämta alla frågor
         */
        const [questions] = await connection.query(
            `
            SELECT
                q.id
            FROM questions q

            INNER JOIN blocks b
                ON b.id = q.block_id

            INNER JOIN exam_blocks eb
                ON eb.block_id = b.id

            WHERE eb.exam_id = ?
            `,
            [groupExam.exam_id]
        );

        /*
         * Slumpa frågor om inställningen säger det
         */
        const orderedQuestions =
            groupExam.shuffle_questions
                ? [...questions].sort(
                    () => Math.random() - 0.5
                )
                : questions;

        /*
         * Spara frågorna + alternativordning
         */
        for (let i = 0; i < orderedQuestions.length; i++) {

            const question = orderedQuestions[i];

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

            /*
             * Hämta alternativ för frågan
             */
            const [options] = await connection.query(
                `
                SELECT
                    id
                FROM options
                WHERE question_id = ?
                    AND deleted_at IS NULL
                `,
                [question.id]
            );

            /*
             * Slumpa alternativ om inställningen säger det
             */
            const orderedOptions =
                groupExam.shuffle_options
                    ? [...options].sort(
                        () => Math.random() - 0.5
                    )
                    : options;

            /*
             * Spara alternativordning
             */
            for (let j = 0; j < orderedOptions.length; j++) {

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
                        orderedOptions[j].id,
                        j + 1
                    ]
                );
            }
        }

        await connection.commit();

        res.json({
            attempt_id: attemptId,
            exam_config: groupExam.exam_config
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
                    status
                FROM exam_attempts
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
            UPDATE exam_attempts
            SET
                status = 'submitted',
                submitted_at = NOW()
            WHERE id = ?
            `,
            [id]
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
                FROM exam_attempts
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
                FROM answers a
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
