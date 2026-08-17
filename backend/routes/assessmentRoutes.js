import express from "express";
import db from "../db.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import getExamRole from "../utils/getAssessmentRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

/*
GET    /api/assessments
POST   /api/assessments

GET    /api/assessments/:id
PUT    /api/assessments/:id
DELETE /api/assessments/:id

GET    /api/assessments/:id/blocks
POST   /api/assessments/:id/blocks
DELETE /api/assessments/:id/blocks/:blockId

GET    /api/assessments/:id/users
POST   /api/assessments/:id/users
DELETE /api/assessments/:id/users/:userId
*/

// GET /api/assessments
router.get("/", async (req, res) => {
    try {

        const [assessments] = await db.query(
            `
            SELECT
                a.*,
                ap.role
            FROM assessments a
            INNER JOIN assessment_permissions ap
                ON ap.assessment_id = a.id
            WHERE
                a.deleted_at IS NULL
                AND a.archived_at IS NULL
                AND ap.user_id = ?
            ORDER BY a.title
            `,
            [req.user.id]
        );

        res.json(assessments);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }
});

//POST /api/assessments
router.post("/", async (req, res) => {
    const {
        title,
        subject_id,
        level_id,
        book_id
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO assessments (
            title,
            subject_id,
            level_id,
            book_id,
            created_by,
            updated_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            title,
            subject_id,
            level_id,
            book_id || null,
            req.user.id,
            req.user.id
        ]
    );

    await db.query(
        `
        INSERT INTO assessment_permissions (
            assessment_id,
            user_id,
            role
        )
        VALUES (?, ?, ?)
        `,
        [
            result.insertId,
            req.user.id,
            'owner'
        ]
    );
});


//GET /api/assessments/:assessmentId
router.get("/:assessmentId", async (req, res) => {

    const [assessmentRows] = await db.query(
        `
        SELECT *
        FROM assessments
        WHERE id = ?
        `,
        [req.params.assessmentId]
    );

    if (!assessmentRows.length) {
        return res.status(404).json({
            error: "Exam not found"
        });
    }

    const role = await getExamRole(
        req.params.assessmentId,
        req.user.id
    );

    const [blocks] = await db.query(
        `
        SELECT b.*, eb.sort_order
        FROM blocks b
        JOIN assessment_blocks eb
            ON eb.block_id = b.id
        WHERE eb.assessment_id = ?
        ORDER BY eb.sort_order
        `,
        [req.params.assessmentId]
    );

    await hydrateBlocks(blocks);

    const [groupExams] = await db.query(
        `
        SELECT *
        FROM group_assessments
        WHERE assessment_id = ?
        `,
        [req.params.assessmentId]
    );

    res.json({
        ...assessmentRows[0],
        role,
        blocks,
        groupExams
    });
});
//PUT /api/assessments/:assessmentId
router.put("/:assessmentId", async (req, res) => {
    const { title } = req.body;
    await db.query(
        `
        UPDATE assessments
        SET title = ?
        WHERE id = ?
        `,
        [title, req.params.assessmentId]
    );

    res.sendStatus(204);
});
// DELETE /api/assessments/:assessmentId
router.delete("/:assessmentId", async (req, res) => {
    try {

        await db.query(
            `
            UPDATE assessments
            SET
                deleted_at = NOW(),
                updated_by = ?
            WHERE id = ?
            `,
            [
                req.user.id,
                req.params.assessmentId
            ]
        );

        await db.query(
            `
            DELETE FROM assessment_permissions
            WHERE assessment_id = ?
                AND user_id = ?
            `,
            [
                req.params.assessmentId,
                req.user.id
            ]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte ta bort provet."
        });

    }
});


// POST /api/assessments/:id/archive
router.post("/:id/archive",
    async (req, res) => {

        const assessmentId = req.params.id;

        const [permissions] =
            await db.query(
                `
                SELECT 1
                FROM assessment_permissions
                WHERE assessment_id = ?
                AND user_id = ?
                AND role = 'owner'
                `,
                [
                    assessmentId,
                    req.user.id
                ]
            );

        if (!permissions.length) {

            return res.sendStatus(403);

        }

        await db.query(
            `
            UPDATE assessments
            SET archived_at = NOW()
            WHERE id = ?
            `,
            [assessmentId]
        );

        res.sendStatus(204);

    }
);



// POST /api/teacher/:assessmentId/library-blocks
router.post("/:assessmentId/library-blocks",
    async (req, res) => {

        const { block_id } = req.body;

        const [[row]] = await db.query(
            `
            SELECT
                COALESCE(MAX(sort_order), 0) + 1
                AS nextOrder
            FROM assessment_blocks
            WHERE assessment_id = ?
            `,
            [req.params.assessmentId]
        );

        await db.query(
            `
            INSERT INTO assessment_blocks(
                assessment_id,
                block_id,
                sort_order
            )
            VALUES (?, ?, ?)
            `,
            [
                req.params.assessmentId,
                block_id,
                row.nextOrder
            ]
        );

        res.sendStatus(201);

    }
);

//GET /api/assessments/:assessmentId/copy
router.post("/:assessmentId/copy", async (req, res) => {

    const [assessmentRows] = await db.query(
        `
        SELECT *
        FROM assessments
        WHERE id = ?
        `,
        [req.params.assessmentId]
    );

    if (!assessmentRows.length) {
        return res.status(404).json({
            error: "Exam not found"
        });
    }

    const assessment = assessmentRows[0];

    const [newExam] = await db.query(
        `
        INSERT INTO assessments(title)
        VALUES(?)
        `,
        [`${assessment.title} (kopia)`]
    );

    const newExamId = newExam.insertId;

        await db.query(
        `
        INSERT INTO assessment_teachers(
            assessment_id,
            user_id,
            is_owner
        )
        VALUES (?, ?, 1)
        `,
        [newExamId, req.user.id]
    );

    const [blocks] = await db.query(
        `
        SELECT b.*, eb.sort_order
        FROM blocks b
        JOIN assessment_blocks eb
            ON eb.block_id = b.id
        WHERE eb.assessment_id = ?
        `,
        [req.params.assessmentId]
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
            INSERT INTO assessment_blocks(
                assessment_id,
                block_id,
                sort_order
            )
            VALUES (?, ?, ?)
            `,
            [
                newExamId,
                newBlockId,
                block.sort_order
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
                    answer_config
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    question.question,
                    newBlockId,
                    question.type,
                    question.answer_config
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

// GET /api/assessments/:assessmentId/blocks
router.get("/:assessmentId/blocks", async (req, res) => {

    try {

        const [rows] = await db.query(
            `
            SELECT
                b.*
            FROM assessment_blocks eb
            JOIN blocks b
                ON b.id = eb.block_id
            WHERE eb.assessment_id = ?
            ORDER BY eb.sort_order
            `,
            [req.params.assessmentId]
        );

        const blocks =
            await hydrateBlocks(rows);

        res.json(blocks);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


// POST /api//assessments/:assessmentId/blocks
router.post("/:assessmentId/blocks", async (req, res) => {

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
        SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder
        FROM assessment_blocks
        WHERE assessment_id = ?
        `,
        [req.params.assessmentId]
    );

    const orderBy = rows[0].nextOrder;

    await db.query(
        `
        INSERT INTO assessment_blocks(
            assessment_id,
            block_id,
            sort_order
        )
        VALUES (?, ?, ?)
        `,
        [
            req.params.assessmentId,
            blockResult.insertId,
            orderBy
        ]
    );

    res.json({
        id: blockResult.insertId
    });
});

// DELETE /api//assessments/:assessmentId/blocks
router.delete("/:assessmentId/blocks/:blockId",
    async (req, res) => {

        const role =
            await getExamRole(
                req.params.assessmentId,
                req.user.id
            );

        if (
            role !== "owner"
        ) {

            return res.status(403).json({
                error: "Endast ägeren kan ta bort block."
            });

        }

        await db.query(
            `
            DELETE FROM assessment_blocks
            WHERE assessment_id = ?
            AND block_id = ?
            `,
            [
                req.params.assessmentId,
                req.params.blockId
            ]
        );

        res.sendStatus(204);

    }
);


// POST /api/assessments/:assessmentId/import-block
router.post("/:assessmentId/import-block",
    async (req, res) => {

        const { block_id } = req.body;

        const [rows] = await db.query(
            `
            SELECT
                COALESCE(
                    MAX(sort_order),
                    0
                ) + 1 AS nextOrder
            FROM assessment_blocks
            WHERE assessment_id = ?
            `,
            [req.params.assessmentId]
        );

        const orderBy =
            rows[0].nextOrder;

        const [existing] = await db.query(
            `
            SELECT id
            FROM assessment_blocks
            WHERE assessment_id = ?
            AND block_id = ?
            `,
            [
                req.params.assessmentId,
                block_id
            ]
        );

        if (existing.length) {

            return res.status(409).json({
                success: false,
                message: "Blocket finns redan i provet"
            });

        }

        await db.query(
            `
            INSERT INTO assessment_blocks (
                assessment_id,
                block_id,
                sort_order
            )
            VALUES (?, ?, ?)
            `,
            [
                req.params.assessmentId,
                block_id,
                orderBy
            ]
        );

        res.json({
            success: true
        });

    }
);

//DELETE /api/assessments/:assessmentId/blocks/:blockId
router.delete("/:assessmentId/blocks/:blockId", async (req, res) => {
    await db.query(
        `
        DELETE FROM assessment_blocks
        WHERE assessment_id = ?
        AND block_id = ?
        `,
        [req.params.assessmentId, req.params.blockId]
    );

    res.sendStatus(204);
});


//PUT /api/assessments/:assessmentId/blocks/:blockId/order
router.put("/:assessmentId/blocks/:blockId/order",
    async (req, res) => {

        const { sort_order } = req.body;

        await db.query(
            `
            UPDATE assessment_blocks
            SET sort_order = ?
            WHERE assessment_id = ?
            AND block_id = ?
            `,
            [
                sort_order,
                req.params.assessmentId,
                req.params.blockId
            ]
        );

        res.sendStatus(204);
    }
);

export default router
