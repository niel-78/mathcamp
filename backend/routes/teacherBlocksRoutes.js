import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
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
const upload = multer({ storage })

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));


//GET /api/teacher/blocks
router.get("/", async (req, res) => {
    const [rows] = await db.query(`
        SELECT *
        FROM blocks
        ORDER BY name
    `);

    res.json(rows);
});

// GET /api/teacher/blocks/full
router.get("/full", async (req, res) => {

    const [blocks] = await db.query(`
        SELECT *
        FROM blocks
        ORDER BY name
    `);

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

    res.json(blocks);
});

//GET /api/teacher/blocks/:blockId
router.get("/:blockId", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM blocks
        WHERE id = ?
        `,
        [req.params.blockId]
    );

    res.json(rows[0]);
});


// POST /api/teacher/blocks
router.post("/", async (req, res) => {
    const { name } = req.body;

    const [result] = await db.query(
        "INSERT INTO blocks(name) VALUES(?)",
        [name]
    );

    res.json({
        id: result.insertId
    });
});

// PUT /api/teacher/blocks/:blockId
router.put("/:blockId", async (req, res) => {

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

// DELETE /api/teacher/blocks/:blockId
router.delete("/:blockId", async (req, res) => {

    await db.query(
        `
        DELETE FROM blocks
        WHERE id = ?
        `,
        [req.params.blockId]
    );

    res.sendStatus(204);
});


// POST /api/teacher/blocks/:blockId/questions
router.post("/:blockId/questions", async (req, res) => {

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


// PUT /api/teacher/blocks/questions/:questionId
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

//DELETE /api/teacher/questions/:questionId
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


// POST /api/teacher/blocks/questions/:questionId/options
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


// PUT /api/teacher/blocks/options/:optionId
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

// DELETE /api/teacher/blocks/questions/:questionId
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


// POST /api/teacher/blocks/questions/:questionId/media
router.post("/questions/:questionId/media",
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

// DELETE /api/teacher/blocks/media/:mediaId
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



export default router;