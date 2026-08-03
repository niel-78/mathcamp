import express from "express";
import db from "../db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import formatDateTime from "../utils/formatDateTime.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

/* 
GET    /api/group-exams
POST   /api/group-exams

GET    /api/group-exams/:id
PUT    /api/group-exams/:id
DELETE /api/group-exams/:id

GET    /api/group-exams/:id/blocks

GET    /api/group-exams/:id/attempts

POST   /api/group-exams/:id/open
POST   /api/group-exams/:id/close

*/

// GET /api/group-exams
router.get("/", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT
            ge.*,
            e.title AS exam_title,
            g.name AS group_name
        FROM group_exams ge
        JOIN exams e
            ON e.id = ge.exam_id
        JOIN groups g
            ON g.id = ge.group_id
        JOIN exam_users eu
            ON eu.exam_id = ge.exam_id
        WHERE eu.user_id = ?
        ORDER BY ge.created_at DESC
        `,
        [req.user.id]
    );

    res.json(rows);

});
// POST /api/group-exams
router.post("/", async (req, res) => {

    try {

        const {
            group_id,
            exam_id
        } = req.body;

        const generateUniqueGroupExamKey =
            async () => {

                while (true) {

                    const key = Math.floor(
                        100000 +
                        Math.random() * 900000
                    ).toString();

                    const [[existing]] =
                        await db.query(
                            `
                            SELECT id
                            FROM group_exams
                            WHERE group_exam_key = ?
                            `,
                            [key]
                        );

                    if (!existing) {
                        return key;
                    }

                }

            };

        const groupExamKey =
            await generateUniqueGroupExamKey();

        const [result] =
            await db.query(
                `
                INSERT INTO group_exams (
                    group_id,
                    exam_id,
                    group_exam_key
                )
                VALUES (?, ?, ?)
                `,
                [
                    group_id,
                    exam_id,
                    groupExamKey
                ]
            );

        res.status(201).json({
            id: result.insertId
        });

    } catch (err) {

        if (
            err.code === "ER_DUP_ENTRY"
        ) {

            return res.status(409).json({
                error:
                    "Gruppen har redan ett provtillfälle för detta prov."
            });

        }

        console.error(err);

        res.status(500).json({
            error:
                "Kunde inte skapa provtillfället."
        });

    }

});

// GET /api/group-exams/:id
router.get("/:id", async (req, res) => {

    const [[groupExam]] = await db.query(
        `
        SELECT
            ge.*,
            e.title AS exam_title,
            g.name AS group_name
        FROM group_exams ge
        JOIN exams e
            ON e.id = ge.exam_id
        JOIN groups g
            ON g.id = ge.group_id
        JOIN exam_users eu
            ON eu.exam_id = ge.exam_id
        WHERE ge.id = ?
        AND eu.user_id = ?
        `,
        [
            req.params.id,
            req.user.id
        ]
    );

    if (!groupExam) {
        return res.sendStatus(404);
    }

    res.json(groupExam);

});
// PUT /api/group-exams/:id
router.put("/:id", async (req, res) => {

    const {
        exam_config,
        time_limit_minutes,

        shuffle_questions,
        shuffle_options,

        allow_previous,
        allow_same_question,

        show_calculator,
        show_formula_sheet,

        max_attempts,

        show_result_immediately,
        passing_score,

        is_open,

        available_from,
        available_until
    } = req.body;

    await db.query(
        `
        UPDATE group_exams
        SET
            exam_config = ?,

            time_limit_minutes = ?,

            shuffle_questions = ?,
            shuffle_options = ?,

            allow_previous = ?,
            allow_same_question = ?,

            show_calculator = ?,
            show_formula_sheet = ?,

            max_attempts = ?,

            show_result_immediately = ?,
            passing_score = ?,

            is_open = ?,

            available_from = ?,
            available_until = ?

        WHERE id = ?
        `,
        [
            JSON.stringify(
                exam_config || {}
            ),

            time_limit_minutes,

            shuffle_questions,
            shuffle_options,

            allow_previous,
            allow_same_question,

            show_calculator,
            show_formula_sheet,

            max_attempts,

            show_result_immediately,
            passing_score,

            is_open,

            formatDateTime(
                available_from
            ),
            formatDateTime(
                available_until
            ),

            req.params.id
        ]
    );

    res.sendStatus(204);

});
// DELETE /api/teacher/group-exams/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        DELETE FROM group_exams
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.sendStatus(204);
});

//GET /api/group-exams/:id/blocks
router.get("/:id/blocks", async (req, res) => {

        const [blocks] = await db.query(
            `
            SELECT b.*
            FROM group_exams ge
            JOIN exam_blocks eb
                ON eb.exam_id = ge.exam_id
            JOIN blocks b
                ON b.id = eb.block_id
            WHERE ge.id = ?
            ORDER BY eb.order_by
            `,
            [req.params.id]
        );

        const hydratedBlocks =
            await hydrateBlocks(blocks);

        res.json(hydratedBlocks);

    }
);

//GET /api/group-exams/:id/attempts

//POST /api/group-exams/:id/open
//POST /api/group-exams/:id/close

export default router
