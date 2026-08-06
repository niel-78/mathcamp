import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));


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

/*
GET /api/questions/:id
PUT /api/questions/:id
DELETE /api/questions/:id

POST /api/questions/:id/duplicate

POST /api/questions/:id/media
DELETE /api/questions/media/:id
*/



// GET /api/questions/:id
router.get("/:id", async (req, res) => {

    const questionId =
        req.params.id;

    const [[question]] =
        await db.query(
            `
            SELECT
                q.*,
                ql.name AS level_name
            FROM questions q
            LEFT JOIN question_levels ql
                ON ql.id = q.level_id
            WHERE q.id = ?
                AND q.deleted_at IS NULL
            `,
            [questionId]
        );

    if (!question) {

        return res
            .status(404)
            .json({
                error: "Question not found"
            });

    }

    const [options] =
        await db.query(
            `
            SELECT *
            FROM options
            WHERE question_id = ?
                AND deleted_at IS NULL
            ORDER BY id
            `,
            [questionId]
        );

    const [media] =
        await db.query(
            `
            SELECT *
            FROM question_media
            WHERE question_id = ?
            ORDER BY id
            `,
            [questionId]
        );

    res.json({
        ...question,
        options,
        media
    });

});

// PUT /api/questions/:id
router.put("/:id", async (req, res) => {

    const {
        question,
        question_type,
        answer_config,
        level_id
    } = req.body;

    await db.query(
        `
        UPDATE questions
        SET
            question = ?,
            question_type = ?,
            answer_config = ?,
            level_id = ?

        WHERE id = ?
        `,
        [
            question,
            question_type,
            JSON.stringify(answer_config),
            level_id,
            req.params.id
        ]
    );

    res.sendStatus(204);
});

//DELETE /api/questions/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        UPDATE questions
        SET
            deleted_at = NOW(),
            updated_at = NOW(),
            updated_by = ?
        WHERE id = ?
        `,
        [
            req.user.id,
            req.params.id
        ]
    );

    res.sendStatus(204);
});

//POST /api/questions/:id/duplicate
router.post("/:id/duplicate",
    async (req, res) => {

        const questionId =
            req.params.id;

        const [[question]] =
            await db.query(
                `
                SELECT *
                FROM questions
                WHERE id = ?
                `,
                [questionId]
            );

        if (!question) {
            return res
                .status(404)
                .json({
                    error:
                        "Question not found"
                });
        }

        const [result] =
            await db.query(
                `
                INSERT INTO questions (
                    block_id,
                    question,
                    question_type,
                    answer_config,
                    created_by,
                    updated_by,
                    level_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    question.block_id,
                    question.question,
                    question.question_type,
                    question.answer_config,
                    req.user.id,
                    req.user.id,
                    question.level_id
                ]
            );

        const newQuestionId =
            result.insertId;

        const [options] =
            await db.query(
                `
                SELECT *
                FROM options
                WHERE question_id = ?
                AND deleted_at IS NULL
                `,
                [questionId]
            );

        for (const option of options) {

            await db.query(
                `
                INSERT INTO options (
                    question_id,
                    text,
                    is_correct,
                    created_by,
                    updated_by
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    newQuestionId,
                    option.text,
                    option.is_correct,
                    req.user.id,
                    req.user.id
                ]
            );

        }

        const [media] =
            await db.query(
                `
                SELECT *
                FROM question_media
                WHERE question_id = ?
                ORDER BY id
                `,
                [questionId]
            );

        for (const media_item of media) {

            await db.query(
                `
                INSERT INTO question_media (
                    question_id,
                    media_type,
                    media_url,
                    sort_order
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    newQuestionId,
                    media_item.media_type,
                    media_item.media_url,
                    media_item.sort_order
                ]
            );

        }

        res.status(201).json({
            id: newQuestionId
        });

    }
);

// POST /api/questions/:id/media
router.post("/:id/media", upload.single("file"),
    async (req, res) => {

        console.log("FILE:", req.file);
        console.log("CWD:", process.cwd());

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
                req.params.id,
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
// DELETE /api/questions/media/:id
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