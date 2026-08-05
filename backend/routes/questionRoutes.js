import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import hydrateBlocks from "../utils/hydrateBlocks.js";
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

/*
GET /api/questions/:id
PUT /api/questions/:id
DELETE /api/questions/:id

POST /api/questions/:id/media
DELETE /api/questions/media/:id
*/


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