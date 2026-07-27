import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

//GET /api/teacher/exams
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                e.id,
                e.title,
                et.is_owner
            FROM exams e
            JOIN exam_teachers et
                ON e.id = et.exam_id
            WHERE et.teacher_id = ?
            ORDER BY e.title
            `,
            [req.user.id]
        );

        res.json(rows);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});

//POST /api/teacher/exams
router.post("/", async (req, res) => {
    const { title } = req.body;

    const [result] = await db.query(
        "INSERT INTO exams (title) VALUES (?)",
        [title]
    );

    await db.query(
        `
        INSERT INTO exam_teachers (
            exam_id,
            teacher_id,
            is_owner
        )
        VALUES (?, ?, 1)
        `,
        [result.insertId, req.user.id]
    );

    res.json({
        id: result.insertId
    });
});


//GET /api/teacher/exams/:examId
router.get("/:examId", async (req, res) => {
    const [rows] = await db.query(
        "SELECT * FROM exams WHERE id = ?",
        [req.params.examId]
    );

    res.json(rows[0]);
});

//PUT /api/teacher/exams/:examId
router.put("/:examId", async (req, res) => {
    const { title } = req.body;
    console.log("uppdatera titel")
    await db.query(
        `
        UPDATE exams
        SET title = ?
        WHERE id = ?
        `,
        [title, req.params.examId]
    );

    res.sendStatus(204);
});

// DELETE /api/teacher/exams/:examId
router.delete("/:examId", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM exam_teachers
        WHERE exam_id = ?
        AND teacher_id = ?
        AND is_owner = 1
        `,
        [req.params.examId, req.user.id]
    );

    if (!rows.length) {
        return res.status(403).json({
            error: "Only owner can delete exam"
        });
    }
    
    await db.query(
        `
        DELETE FROM exams
        WHERE id = ?
        `,
        [req.params.examId]
    );

    res.sendStatus(204);
});


//GET /api/teacher/exams/:examId/full
router.get("/:examId/full", async (req, res) => {

    const [examRows] = await db.query(
        `
        SELECT *
        FROM exams
        WHERE id = ?
        `,
        [req.params.examId]
    );

    if (!examRows.length) {
        return res.status(404).json({
            error: "Exam not found"
        });
    }

    const [blocks] = await db.query(
        `
        SELECT b.*, eb.order_by
        FROM blocks b
        JOIN exam_blocks eb
            ON eb.block_id = b.id
        WHERE eb.exam_id = ?
        ORDER BY eb.order_by
        `,
        [req.params.examId]
    );

    for (const block of blocks) {

        const [questions] = await db.query(
            `
            SELECT *
            FROM questions
            WHERE block_id = ?
            `,
            [block.id]
        );

        for (const question of questions) {

            const [media] = await db.query(
                `
                SELECT *
                FROM question_media
                WHERE question_id = ?
                ORDER BY sort_order
                `,
                [question.id]
            );
            
            question.media = media;

            const [options] = await db.query(
                `
                SELECT *
                FROM options
                WHERE question_id = ?
                `,
                [question.id]
            );

            question.options = options;
        }

        block.questions = questions;
    }

    const [groupExams] = await db.query(
        `
        SELECT *
        FROM group_exams
        WHERE exam_id = ?
        `,
        [req.params.examId]
    );

    res.json({
        ...examRows[0],
        blocks,
        groupExams
    });
});

//GET /api/teacher/exams/:examId/copy
router.post("/:examId/copy", async (req, res) => {

    console.log("COPY ROUTE HIT");

    const [examRows] = await db.query(
        `
        SELECT *
        FROM exams
        WHERE id = ?
        `,
        [req.params.examId]
    );

    if (!examRows.length) {
        return res.status(404).json({
            error: "Exam not found"
        });
    }

    const exam = examRows[0];

    const [newExam] = await db.query(
        `
        INSERT INTO exams(title)
        VALUES(?)
        `,
        [`${exam.title} (kopia)`]
    );

    const newExamId = newExam.insertId;

        await db.query(
        `
        INSERT INTO exam_teachers(
            exam_id,
            teacher_id,
            is_owner
        )
        VALUES (?, ?, 1)
        `,
        [newExamId, req.user.id]
    );

    const [blocks] = await db.query(
        `
        SELECT b.*, eb.order_by
        FROM blocks b
        JOIN exam_blocks eb
            ON eb.block_id = b.id
        WHERE eb.exam_id = ?
        `,
        [req.params.examId]
    );

    for (const block of blocks) {

        const [newBlock] = await db.query(
            `
            INSERT INTO blocks(name)
            VALUES(?)
            `,
            [block.name]
        );

    const newBlockId = newBlock.insertId;

        await db.query(
            `
            INSERT INTO exam_blocks(
                exam_id,
                block_id,
                order_by
            )
            VALUES (?, ?, ?)
            `,
            [
                newExamId,
                newBlockId,
                block.order_by
            ]
        );

        const [questions] = await db.query(
            `
            SELECT *
            FROM questions
            WHERE block_id = ?
            `,
            [block.id]
        );

        for (const question of questions) {

            const [newQuestion] = await db.query(
                `
                INSERT INTO questions(
                    question,
                    block_id,
                    type,
                    math_config
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    question.question,
                    newBlockId,
                    question.type,
                    question.math_config
                ]
            );

            const newQuestionId =
                newQuestion.insertId;


            const [media] = await db.query(
                `
                SELECT *
                FROM question_media
                WHERE question_id = ?
                `,
                [question.id]
            );

            for (const m of media) {

                await db.query(
                    `
                    INSERT INTO question_media(
                        question_id,
                        media_type,
                        media_url,
                        sort_order
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        newQuestionId,
                        m.media_type,
                        m.media_url,
                        m.sort_order
                    ]
                );
            }

            const [options] = await db.query(
                `
                SELECT *
                FROM options
                WHERE question_id = ?
                `,
                [question.id]
            );

            for (const option of options) {

                await db.query(
                    `
                    INSERT INTO options(
                        question_id,
                        text,
                        is_correct
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        newQuestionId,
                        option.text,
                        option.is_correct
                    ]
                );
            }
        }
    }

    res.json({
        id: newExamId
    });
});


// POST /api/teacher/exams/:examId/blocks
router.post("/:examId/blocks", async (req, res) => {

    const { name } = req.body;

    const [blockResult] = await db.query(
        `
        INSERT INTO blocks(name)
        VALUES(?)
        `,
        [name]
    );

    const [rows] = await db.query(
        `
        SELECT COALESCE(MAX(order_by), 0) + 1 AS nextOrder
        FROM exam_blocks
        WHERE exam_id = ?
        `,
        [req.params.examId]
    );

    const orderBy = rows[0].nextOrder;

    await db.query(
        `
        INSERT INTO exam_blocks(
            exam_id,
            block_id,
            order_by
        )
        VALUES (?, ?, ?)
        `,
        [
            req.params.examId,
            blockResult.insertId,
            orderBy
        ]
    );

    res.json({
        id: blockResult.insertId
    });
});

//DELETE /api/teacher/exams/:examId/blocks/:blockId
router.delete("/:examId/blocks/:blockId", async (req, res) => {
    await db.query(
        `
        DELETE FROM exam_blocks
        WHERE exam_id = ?
        AND block_id = ?
        `,
        [req.params.examId, req.params.blockId]
    );

    res.sendStatus(204);
});


//PUT /api/teacher/exams/:examId/blocks/:blockId/order
router.put("/:examId/blocks/:blockId/order",
    async (req, res) => {

        console.log("ORDER ROUTE HIT!!");
        console.log(req.params);
        console.log(req.body);
        
        const { order_by } = req.body;

        await db.query(
            `
            UPDATE exam_blocks
            SET order_by = ?
            WHERE exam_id = ?
            AND block_id = ?
            `,
            [
                order_by,
                req.params.examId,
                req.params.blockId
            ]
        );

        res.sendStatus(204);
    }
);


export default router
