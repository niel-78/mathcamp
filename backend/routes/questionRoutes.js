import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

import { getAppSettings } from "../utils/getAppSettings.js";
import { autoFixQuestion, autoFixMultipleQuestions } from "../utils/autoFixQuestion.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));


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
    try {
        const {
            question,
            question_type,
            answer_config,
            level_id,
            calculator_allowed,
            geogebra_allowed
        } = req.body;

        const updates = [];
        const params = [];

        if (question !== undefined) {
            updates.push("question = ?");
            params.push(question);
        }

        if (question_type !== undefined) {
            updates.push("question_type = ?");
            params.push(question_type);
        }

        if (answer_config !== undefined) {
            updates.push("answer_config = ?");
            if (answer_config === null) {
                params.push(null);
            } else if (typeof answer_config === "string") {
                params.push(answer_config);
            } else {
                params.push(JSON.stringify(answer_config));
            }
        }

        if (level_id !== undefined) {
            updates.push("level_id = ?");
            params.push(level_id === null || level_id === "" ? null : Number(level_id));
        }

        if (calculator_allowed !== undefined) {
            updates.push("calculator_allowed = ?");
            params.push(calculator_allowed ? 1 : 0);
        }

        if (geogebra_allowed !== undefined) {
            updates.push("geogebra_allowed = ?");
            params.push(geogebra_allowed ? 1 : 0);
        }

        updates.push("updated_at = NOW()");

        if (req.user?.id) {
            updates.push("updated_by = ?");
            params.push(req.user.id);
        }

        if (updates.length === 0) {
            return res.sendStatus(204);
        }

        params.push(req.params.id);

        await db.query(
            `
            UPDATE questions
            SET ${updates.join(", ")}
            WHERE id = ?
            AND deleted_at IS NULL
            `,
            params
        );

        res.sendStatus(204);
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({
            error: error.message || "Kunde inte spara frågan."
        });
    }
});

router.put("/:id/series-level", async (req, res) => {
    const { series_level_id } = req.body;

    await db.query(
        `
        UPDATE questions
        SET series_level_id = ?
        WHERE id = ?
        `,
        [
            series_level_id,
            req.params.id
        ]
    );

    res.sendStatus(204);
});

router.put("/:id/exclude-from-assessments", async (req, res) => {
    const { excluded_from_assessments: excluded } = req.body;

    if (typeof excluded !== "boolean") {
        return res.status(400).json({
            error: "Exkludering måste anges som sant eller falskt."
        });
    }

    const [result] = await db.query(
        `
        UPDATE questions
        SET
            excluded_from_assessments = ?,
            updated_by = ?
        WHERE id = ?
        AND deleted_at IS NULL
        `,
        [excluded ? 1 : 0, req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            error: "Frågan hittades inte."
        });
    }

    res.sendStatus(204);
});

router.delete("/:id/question-reports", async (req, res) => {
    await db.query(
        `
        DELETE FROM question_reports
        WHERE question_id = ?
        AND report_type = 'missing_correct_option'
        `,
        [req.params.id]
    );

    res.sendStatus(204);
});

// POST /api/questions/auto-fix-all
router.post("/auto-fix-all", async (req, res) => {
    try {
        const { questionIds } = req.body;

        let targetIds = questionIds;
        if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
            // Find all active questions
            const [rows] = await db.query(
                `
                SELECT q.id
                FROM questions q
                JOIN blocks b ON b.id = q.block_id
                WHERE q.deleted_at IS NULL AND q.archived_at IS NULL
                AND b.deleted_at IS NULL AND b.archived_at IS NULL
                `
            );
            targetIds = rows.map(r => r.id);
        }

        const result = await autoFixMultipleQuestions(targetIds, req.user.id);
        res.json(result);
    } catch (error) {
        console.error("Error auto-fixing all questions:", error);
        res.status(500).json({
            error: error.message || "Kunde inte åtgärda felen."
        });
    }
});

// POST /api/questions/:id/auto-fix
router.post("/:id/auto-fix", async (req, res) => {
    try {
        const result = await autoFixQuestion(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        console.error(`Error auto-fixing question ${req.params.id}:`, error);
        res.status(500).json({
            error: error.message || "Kunde inte åtgärda frågan."
        });
    }
});

// DELETE /api/questions/:id
router.delete("/:id", async (req, res) => {

    const connection =
        await db.getConnection();

    try {

        const settings =
            await getAppSettings(
                connection
            );

        const [questionRows] =
            await connection.query(
                `
                SELECT
                    block_id
                FROM questions
                WHERE id = ?
                    AND deleted_at IS NULL
                `,
                [req.params.id]
            );

        if (
            questionRows.length === 0
        ) {

            return res.status(404).json({
                error: "Frågan hittades inte."
            });

        }

        const blockId =
            questionRows[0].block_id;

        if (
            !settings.first_question_in_block_can_be_deleted
        ) {

            const [countRows] =
                await connection.query(
                    `
                    SELECT
                        COUNT(*) AS count
                    FROM questions
                    WHERE block_id = ?
                        AND deleted_at IS NULL
                    `,
                    [blockId]
                );

            if (
                countRows[0].count <= 1
            ) {

                return res.status(400).json({
                    error:
                        "Den sista frågan i blocket kan inte tas bort."
                });

            }

        }

        await connection.query(
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

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte ta bort frågan."
        });

    } finally {

        connection.release();

    }

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
                    level_id,
                    series_level_id,
                    calculator_allowed,
                    geogebra_allowed
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    question.block_id,
                    question.question,
                    question.question_type,
                    JSON.stringify(
                        question.answer_config
                    ),
                    req.user.id,
                    req.user.id,
                    question.level_id,
                    question.series_level_id,
                    question.calculator_allowed ? 1 : 0,
                    question.geogebra_allowed ? 1 : 0
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

    try {
        await fs.promises.unlink(filePath);
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

// POST /api/questions/:id/archive
router.post("/:id/archive",
    async (req, res) => {

        await db.query(
            `
            UPDATE questions
            SET archived_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);



export default router;