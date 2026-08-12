import express from "express";
import db from "../db.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import getExamRole from "../utils/getExamRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

/*
GET    /api/exams
POST   /api/exams

GET    /api/exams/:id
PUT    /api/exams/:id
DELETE /api/exams/:id

GET    /api/exams/:id/blocks
POST   /api/exams/:id/blocks
DELETE /api/exams/:id/blocks/:blockId

GET    /api/exams/:id/users
POST   /api/exams/:id/users
DELETE /api/exams/:id/users/:userId
*/

// GET /api/exams
router.get("/", async (req, res) => {
    try {

        const [exams] = await db.query(
            `
            SELECT
                e.*,
                ep.role
            FROM exams e
            INNER JOIN exam_permissions ep
                ON ep.exam_id = e.id
            WHERE
                e.deleted_at IS NULL
                AND ep.teacher_id = ?
            ORDER BY e.title;
            `,
            [req.user.id]
        );

        res.json(exams);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte hämta prov."
        });

    }
});

//POST /api/exams
router.post("/", async (req, res) => {
    const {
        title,
        subject_id,
        level_id,
        book_id
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO exams (
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
        INSERT INTO exam_permissions (
            exam_id,
            teacher_id,
            role
        )
        VALUES (
            ?,
            ?,
            'owner'
        )
        `,
        [
            result.insertId,
            req.user.id
        ]
    );
});


//GET /api/exams/:examId
router.get("/:examId", async (req, res) => {

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

    const role = await getExamRole(
        req.params.examId,
        req.user.id
    );

    const [blocks] = await db.query(
        `
        SELECT b.*, eb.sort_order
        FROM blocks b
        JOIN exam_blocks eb
            ON eb.block_id = b.id
        WHERE eb.exam_id = ?
        ORDER BY eb.sort_order
        `,
        [req.params.examId]
    );

    await hydrateBlocks(blocks);

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
        role,
        blocks,
        groupExams
    });
});
//PUT /api/exams/:examId
router.put("/:examId", async (req, res) => {
    const { title } = req.body;
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
// DELETE /api/exams/:examId
router.delete("/:examId", async (req, res) => {
    try {

        await db.query(
            `
            UPDATE exams
            SET
                deleted_at = NOW(),
                updated_by = ?
            WHERE id = ?
            `,
            [
                req.user.id,
                req.params.examId
            ]
        );

        await db.query(
            `
            DELETE FROM exam_permissions
            WHERE exam_id = ?
                AND teacher_id = ?
            `,
            [
                req.params.examId,
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









// POST /api/teacher/:examId/library-blocks
router.post("/:examId/library-blocks",
    async (req, res) => {

        const { block_id } = req.body;

        const [[row]] = await db.query(
            `
            SELECT
                COALESCE(MAX(sort_order), 0) + 1
                AS nextOrder
            FROM exam_blocks
            WHERE exam_id = ?
            `,
            [req.params.examId]
        );

        await db.query(
            `
            INSERT INTO exam_blocks(
                exam_id,
                block_id,
                sort_order
            )
            VALUES (?, ?, ?)
            `,
            [
                req.params.examId,
                block_id,
                row.nextOrder
            ]
        );

        res.sendStatus(201);

    }
);

//GET /api/exams/:examId/copy
router.post("/:examId/copy", async (req, res) => {

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
        SELECT b.*, eb.sort_order
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

// GET /api/exams/:examId/blocks
router.get("/:examId/blocks", async (req, res) => {

    try {

        const [rows] = await db.query(
            `
            SELECT
                b.*
            FROM exam_blocks eb
            JOIN blocks b
                ON b.id = eb.block_id
            WHERE eb.exam_id = ?
            ORDER BY eb.sort_order
            `,
            [req.params.examId]
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


// POST /api//exams/:examId/blocks
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
        SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder
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
            sort_order
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

// DELETE /api//exams/:examId/blocks
router.delete("/:examId/blocks/:blockId",
    async (req, res) => {

        const role =
            await getExamRole(
                req.params.examId,
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
            DELETE FROM exam_blocks
            WHERE exam_id = ?
            AND block_id = ?
            `,
            [
                req.params.examId,
                req.params.blockId
            ]
        );

        res.sendStatus(204);

    }
);


// POST /api/exams/:examId/import-block
router.post("/:examId/import-block",
    async (req, res) => {

        const { block_id } = req.body;

        const [rows] = await db.query(
            `
            SELECT
                COALESCE(
                    MAX(sort_order),
                    0
                ) + 1 AS nextOrder
            FROM exam_blocks
            WHERE exam_id = ?
            `,
            [req.params.examId]
        );

        const orderBy =
            rows[0].nextOrder;

        const [existing] = await db.query(
            `
            SELECT id
            FROM exam_blocks
            WHERE exam_id = ?
            AND block_id = ?
            `,
            [
                req.params.examId,
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
            INSERT INTO exam_blocks (
                exam_id,
                block_id,
                sort_order
            )
            VALUES (?, ?, ?)
            `,
            [
                req.params.examId,
                block_id,
                orderBy
            ]
        );

        res.json({
            success: true
        });

    }
);

//DELETE /api/exams/:examId/blocks/:blockId
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


//PUT /api/exams/:examId/blocks/:blockId/order
router.put("/:examId/blocks/:blockId/order",
    async (req, res) => {

        const { sort_order } = req.body;

        await db.query(
            `
            UPDATE exam_blocks
            SET sort_order = ?
            WHERE exam_id = ?
            AND block_id = ?
            `,
            [
                sort_order,
                req.params.examId,
                req.params.blockId
            ]
        );

        res.sendStatus(204);
    }
);

export default router
