import multer from "multer";
import path from "path";
import express from "express";
import db from "../db.js";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() +
            path.extname(file.originalname)
        );
    }
});

const upload = multer({ storage });

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

//uppdatera nummer
router.put(
    "/:examId/blocks/:blockId/order",
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


// PUT /api/teacher/exams/blocks/:blockId
router.put("/blocks/:blockId", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE blocks
        SET name = ?
        WHERE id = ?
        `,
        [name, req.params.blockId]
    );

    res.sendStatus(204);
});

// POST /api/teacher/exams/blocks/:blockId/questions
router.post("/blocks/:blockId/questions", async (req, res) => {

    const {
        question,
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
            req.params.blockId,
            type,
            JSON.stringify(math_config)
        ]
    );

    res.json({
        id: result.insertId
    });
});

// DELETE /api/teacher/exams/questions/:questionId
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


// PUT /api/teacher/exams/questions/:questionId
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

// POST /api/teacher/exams/questions/:questionId/options
router.post("/questions/:questionId/options", async (req, res) => {

    const {
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
            req.params.questionId,
            text,
            is_correct
        ]
    );

    res.json({
        id: result.insertId
    });
});

// DELETE /api/teacher/exams/options/:optionId
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


// PUT /api/teacher/exams/options/:optionId
router.put("/options/:optionId", async (req, res) => {

    const { text, is_correct } = req.body;

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

    res.json({
        ...examRows[0],
        blocks
    });
});

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


// POST /api/teacher/exams/questions/:questionId/media
router.post(
    "/questions/:questionId/media",
    upload.single("file"),
    async (req, res) => {

        const mediaType =
            req.file.mimetype.startsWith("video")
                ? "video"
                : "image";

        const mediaUrl =
            "/uploads/" + req.file.filename;

        const [result] = await db.query(
            `
            INSERT INTO question_media (
                question_id,
                media_type,
                media_url
            )
            VALUES (?, ?, ?)
            `,
            [
                req.params.questionId,
                mediaType,
                mediaUrl
            ]
        );

        res.json({
            id: result.insertId,
            media_url: mediaUrl
        });
    }
);

router.delete("/media/:mediaId", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM question_media
        WHERE id = ?
        `,
        [req.params.mediaId]
    );

    if (!rows.length) {
        return res.status(404).json({
            error: "Media not found"
        });
    }

    const filePath = path.join(
        process.cwd(),
        rows[0].media_url.replace(/^\//, "")
    );

    console.log("Deleting:", filePath);

    try {
        await fs.promises.unlink(filePath);
        console.log("File deleted");
    } catch (err) {
        console.error("Delete failed:", err);
    }

    await db.query(
        `
        DELETE FROM question_media
        WHERE id = ?
        `,
        [req.params.mediaId]
    );

    res.sendStatus(204);
});


export default router
