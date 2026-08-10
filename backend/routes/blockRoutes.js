import express from "express";
import db from "../db.js";

import path from "path";
import fs from "fs";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

import { getAppSettings } from "../utils/getAppSettings.js";

const router = express.Router();

/*
GET    /api/blocks
POST   /api/blocks

GET    /api/blocks/:id
PUT    /api/blocks/:id
DELETE /api/blocks/:id

POST   /api/blocks/:id/questions
POST   /api/blocks/:id/options
POST   /api/blocks/:id/attachments

DELETE /api/blocks/:id/sections/:sectionId
DELETE /api/blocks/:id/central-content/:centralContentId

POST   /api/blocks/:id/sections/:sectionId
POST   /api/blocks/:id/central-content/:centralContentId

GET    /api/blocks/sections/:sectionId

*/

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

// GET /api/blocks/sections/:sectionId
router.get("/sections/:sectionId", async (req, res) => {

    const [blocks] = await db.query(
        `
        SELECT
            b.*
        FROM blocks b
        INNER JOIN block_sections bs
            ON bs.block_id = b.id
        WHERE bs.section_id = ?
            AND b.deleted_at IS NULL
        ORDER BY b.id
        `,
        [req.params.sectionId]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks);

});

// GET /api/central-content/:centralContentId
router.get("/:centralContentId/:centralContentId", async (req, res) => {

    const [blocks] = await db.query(
        `
        SELECT
            b.*,
            cu.first_name AS created_by_first_name,
            cu.last_name AS created_by_last_name,
            uu.first_name AS updated_by_first_name,
            uu.last_name AS updated_by_last_name
        FROM blocks b
        JOIN block_central_content bcc
            ON b.id = bcc.block_id
        LEFT JOIN users cu
            ON cu.id = b.created_by
        LEFT JOIN users uu
            ON uu.id = b.updated_by
        WHERE bcc.central_content_id = ?
            AND b.deleted_at IS NULL
        `,
        [req.params.centralContentId]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks);

});

// GET /api/blocks/:id
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


// GET /api/blocks/
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

// POST /api/blocks
router.post("/", async (req, res) => {

    try {

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


        const blockId = blockResult.insertId;

        if (examId) {

            const [rows] = await db.query(
                `
                SELECT
                    COALESCE(MAX(sort_order), 0) + 1
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
                    sort_order
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
                question_type,
                created_by,
                updated_by,
                answer_config
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


        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: error.message
            });
        }
                
    

});


// PUT /api/blocks/:id
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
// DELETE /api/blocks/:id
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

// POST /api/blocks/:id/questions
router.post("/:id/questions", async (req, res) => {

    const {
        question = "",
        question_type = "text",
        answer_config = {}
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO questions(
            question,
            block_id,
            question_type,
            created_by,
            updated_by,
            answer_config
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            question,
            req.params.id,
            question_type,
            req.user.id,
            req.user.id,
            JSON.stringify(answer_config)
        ]
    );

    res.json({
        id: result.insertId
    });

});

// POST   /api/blocks/:id/options
// POST   /api/blocks/:id/attachments

// DELETE /api/blocks/:id/sections/:sectionId
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
// DELETE /api/blocks/:id/central-content/:centralContentId
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

// POST   /api/blocks/:id/sections/:sectionId
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
// POST   /api/blocks/:id/central-content/:centralContentId
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

// POST /api/blocks/:blockId/questions
router.post("/:blockId/questions", async (req, res) => {

    const {
        question = "",
        question_type = 1,
        answer_config = {}
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO questions(
            question,
            block_id,
            question_type,
            created_by,
            updated_by,
            answer_config
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            question,
            req.params.blockId,
            question_type,
            req.user.id,
            req.user.id,
            JSON.stringify(answer_config)
        ]
    );

    res.json({
        id: result.insertId
    });

});


// DELETE /api/teacher/questions/:questionId
router.delete("/questions/:questionId", async (req, res) => {


        const connection =
            await db.getConnection();

        try {

            const settings =
                await getAppSettings(
                    connection
                );

            const [
                questionRows
            ] = await connection.query(
                `
                SELECT
                    block_id
                FROM questions
                WHERE id = ?
                    AND deleted_at IS NULL
                `,
                [
                    req.params.questionId
                ]
            );

            if (
                questionRows.length === 0
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Frågan hittades inte."
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
                        SELECT COUNT(*) AS count
                        FROM questions
                        WHERE block_id = ?
                            AND deleted_at IS NULL
                        `,
                        [blockId]
                    );

                if (
                    countRows[0].count <= 1
                ) {

                    return res
                        .status(400)
                        .json({
                            error:
                                "Den sista frågan i ett block kan inte tas bort."
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
                    req.params.questionId
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

    }
);

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







export default router;