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

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));


//GET /api/teacher/blocks
router.get("/", async (req, res) => {
    const [rows] = await db.query(`
        SELECT *
        FROM blocks
        WHERE deleted_at IS NULL
        ORDER BY name
    `);

    res.json(rows);
});

// GET /api/teacher/blocks/
router.get("/", async (req, res) => {

    const [blocks] = await db.query(`
        SELECT
            b.*,
            cu.first_name AS created_by_first_name,
            cu.last_name AS created_by_last_name,
            uu.first_name AS updated_by_first_name,
            uu.last_name AS updated_by_last_name
        FROM blocks b
        LEFT JOIN users cu
            ON cu.id = b.created_by
        LEFT JOIN users uu
            ON uu.id = b.updated_by
        WHERE b.deleted_at IS NULL
    `);

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks);
});

//GET /api/teacher/blocks/:blockId/
router.get("/:blockId/", async (req, res) => {

    const [blocks] = await db.query(
        `
        SELECT
            b.*,
            cu.first_name AS created_by_first_name,
            cu.last_name AS created_by_last_name,
            uu.first_name AS updated_by_first_name,
            uu.last_name AS updated_by_last_name
        FROM blocks b
        LEFT JOIN users cu
            ON cu.id = b.created_by
        LEFT JOIN users uu
            ON uu.id = b.updated_by
        WHERE b.id = ?
        `,
        [req.params.blockId]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks[0]);

});

//GET /api/teacher/blocks/question-levels
router.get("/question-levels", async (req, res) => {

    try {

        const [levels] = await db.query(`
            SELECT *
            FROM question_levels
            ORDER BY sort_order
        `);

        res.json(levels);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


//GET /api/teacher/blocks/:blockId
router.get("/:blockId", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM blocks
        WHERE deleted_at IS NULL
        WHERE id = ?
        `,
        [req.params.blockId]
    );

    res.json(rows[0]);
});

// POST /api/teacher/blocks
router.post("/", async (req, res) => {

    const {
        question,
        centralContentIds = [],
        sectionIds = [],
        examId
    } = req.body;

    const [blockResult] = await db.query(
        `
        INSERT INTO blocks (
            created_by,
            updated_by
        )
        VALUES (?, ?)
        `,
        [
            req.user.id,
            req.user.id
        ]
    );

    console.log("Block skapade");

    const blockId = blockResult.insertId;

    if (examId) {

        const [rows] = await db.query(
            `
            SELECT
                COALESCE(MAX(order_by), 0) + 1
                AS nextOrder
            FROM exam_blocks
            WHERE exam_id = ?
            `,
            [examId]
        );

        await db.query(
            `
            INSERT INTO exam_blocks (
                exam_id,
                block_id,
                order_by
            )
            VALUES (?, ?, ?)
            `,
            [
                examId,
                blockId,
                rows[0].nextOrder
            ]
        );

    }

    const [questionResult] = await db.query(
        `
        INSERT INTO questions (
            question,
            block_id,
            type,
            created_by,
            updated_by,
            math_config
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            question,
            blockId,
            1,
            req.user.id,
            req.user.id,
            null
        ]
    );

    for (const centralContentId of centralContentIds) {

        await db.query(
            `
            INSERT INTO block_central_content (
                block_id,
                central_content_id
            )
            VALUES (?, ?)
            `,
            [
                blockId,
                centralContentId
            ]
        );

    }

    for (const sectionId of sectionIds) {

        await db.query(
            `
            INSERT INTO block_sections (
                block_id,
                section_id
            )
            VALUES (?, ?)
            `,
            [
                blockId,
                sectionId
            ]
        );

    }

    res.status(201).json({
        id: blockId,
        questionId: questionResult.insertId
    });

});

// PUT /api/teacher/blocks/:blockId
router.put("/:blockId", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE blocks
        SET name = ?,
        updated_by = ?
        WHERE id = ?
        `,
        [name, req.user.id, req.params.blockId]
    );

    res.sendStatus(204);
});

// DELETE /api/teacher/blocks/:blockId
router.delete("/:blockId", async (req, res) => {

    await db.query(
        `
        UPDATE blocks
        SET
        deleted_at = NOW(),
        updated_by = ?
        WHERE id = ?
        `,
        [req.user.id,req.params.blockId]
            );

            res.sendStatus(204);
});


// POST /api/teacher/blocks/:blockId/questions
router.post("/:blockId/questions", async (req, res) => {

    const {
        question = "",
        type = 1,
        math_config = {}
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO questions(
            question,
            block_id,
            type,
            created_by,
            updated_by,
            math_config
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            question,
            req.params.blockId,
            type,
            req.user.id,
            req.user.id,
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
        math_config,
        level_id
    } = req.body;

    await db.query(
        `
        UPDATE questions
        SET
            question = ?,
            type = ?,
            math_config = ?,
            level_id = ?

        WHERE id = ?
        `,
        [
            question,
            type,
            JSON.stringify(math_config),
            level_id,
            req.params.questionId
        ]
    );

    res.sendStatus(204);
});

//DELETE /api/teacher/questions/:questionId
router.delete("/questions/:questionId", async (req, res) => {

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
            req.params.questionId
        ]
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
            is_correct,
            created_by,
            updated_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            req.params.questionId,
            text,
            is_correct,
            req.user.id,
            req.user.id
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
        UPDATE options
        SET deleted_at = NOW()
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

//POST /api/teacher/blocks/:blockId/central-content/:centralContentId
router.post("/:blockId/central-content/:centralContentId",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            INSERT IGNORE INTO block_central_content (
                block_id,
                central_content_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.blockId,
                req.params.centralContentId
            ]
        );

        res.sendStatus(204);
    }
);

//DELETE /api/teacher/blocks/:blockId/central-content/:centralContentId
router.delete("/:blockId/central-content/:centralContentId",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            DELETE FROM block_central_content
            WHERE
                block_id = ?
                AND central_content_id = ?
            `,
            [
                req.params.blockId,
                req.params.centralContentId
            ]
        );

        res.sendStatus(204);
    }
);

//POST /api/teacher/blocks/:blockId/book-sections/:sectionId
router.post("/:blockId/book-sections/:sectionId",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            INSERT IGNORE INTO block_sections (
                block_id,
                section_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.blockId,
                req.params.sectionId
            ]
        );

        res.sendStatus(204);
    }
);

//DELETE /api/teacher/blocks/:blockId/book-sections/:sectionId
router.delete("/:blockId/book-sections/:sectionId",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            DELETE FROM block_sections
            WHERE
                block_id = ?
                AND section_id = ?
            `,
            [
                req.params.blockId,
                req.params.sectionId
            ]
        );

        res.sendStatus(204);
    }
);


export default router;