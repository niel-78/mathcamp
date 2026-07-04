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



//GET /api/teacher/exams/blocks
router.get("/blocks/all", async (req, res) => {
    const [rows] = await db.query(`
        SELECT *
        FROM blocks
        ORDER BY name
    `);

    res.json(rows);
});

//POST /api/teacher/exams/blocks
router.post("/blocks", async (req, res) => {
    const { name } = req.body;

    const [result] = await db.query(
        "INSERT INTO blocks(name) VALUES(?)",
        [name]
    );

    res.json({
        id: result.insertId
    });
});

//POST /api/teacher/exams/:examId/blocks
router.post("/:examId/blocks", async (req, res) => {
    const { blockId } = req.body;

    await db.query(
        `
        INSERT INTO exam_blocks
        (exam_id, block_id)
        VALUES (?, ?)
        `,
        [req.params.examId, blockId]
    );

    res.sendStatus(204);
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

//POST /api/teacher/exams/questions
router.post("/questions", async (req, res) => {

    const {
        question,
        block_id,
        type,
        math_config
    } = req.body;

    const [result] = await db.query(
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
            question,
            block_id,
            type,
            JSON.stringify(math_config)
        ]
    );

    res.json({
        id: result.insertId
    });
});

//PUT /api/teacher/exams/questions/:questionId
router.put("/questions/:questionId", async (req, res) => {

    const {
        question,
        type,
        math_config
    } = req.body;

    await db.query(
        `
        UPDATE questions
        SET
            question = ?,
            type = ?,
            math_config = ?
        WHERE id = ?
        `,
        [
            question,
            type,
            JSON.stringify(math_config),
            req.params.questionId
        ]
    );

    res.sendStatus(204);
});

//DELETE /api/teacher/exams/questions/:questionId
router.delete("/questions/:questionId", async (req, res) => {

    await db.query(
        `
        DELETE FROM questions
        WHERE id = ?
        `,
        [req.params.questionId]
    );

    res.sendStatus(204);
});

//POST /api/teacher/exams/options
router.post("/options", async (req, res) => {

    const {
        question_id,
        text,
        is_correct
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO options(
            question_id,
            text,
            is_correct
        )
        VALUES (?, ?, ?)
        `,
        [
            question_id,
            text,
            is_correct
        ]
    );

    res.json({
        id: result.insertId
    });
});

//PUT /api/teacher/exams/options/:optionId
router.put("/options/:optionId", async (req, res) => {

    const {
        text,
        is_correct
    } = req.body;

    await db.query(
        `
        UPDATE options
        SET
            text = ?,
            is_correct = ?
        WHERE id = ?
        `,
        [
            text,
            is_correct,
            req.params.optionId
        ]
    );

    res.sendStatus(204);
});

//DELETE /api/teacher/exams/options/:optionId
router.delete("/options/:optionId", async (req, res) => {

    await db.query(
        `
        DELETE FROM options
        WHERE id = ?
        `,
        [req.params.optionId]
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
        SELECT b.*
        FROM blocks b
        JOIN exam_blocks eb
            ON eb.block_id = b.id
        WHERE eb.exam_id = ?
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

    res.json({
        ...examRows[0],
        blocks
    });
});


export default router
