import express from "express";
import db from "../db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import formatDateTime from "../utils/formatDateTime.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { buildExamSession } from "../utils/buildExamSession.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher"));

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
            g.name AS group_name,
            ep.role
        FROM group_exams ge

        JOIN exams e
            ON e.id = ge.exam_id

        JOIN groups g
            ON g.id = ge.group_id

        JOIN exam_permissions ep
            ON ep.exam_id = ge.exam_id

        WHERE ep.teacher_id = ?

        ORDER BY ge.created_at DESC
        `,
        [req.user.id]
    );

    res.json(rows);

});

// GET /api/group-exams/:id/students/:userId/events
router.get( "/:id/students/:userId/events", async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                ee.*
            FROM exam_events ee

            INNER JOIN exam_attempts ea
                ON ea.id = ee.attempt_id

            WHERE
                ea.group_exam_id = ?
                AND ea.user_id = ?

            ORDER BY
                ee.created_at DESC
            `,
            [
                req.params.id,
                req.params.userId
            ]
        );

        res.json(rows);

    }
);


// POST /api/group-exams
router.post("/", async (req, res) => {

    try {

        const {
            group_id,
            exam_id
        } = req.body;

        const [[exam]] =
        await db.query(
            `
            SELECT exam_config
            FROM exams
            WHERE id = ?
            `,
            [exam_id]
        );

        if (!exam) {

            return res.status(404).json({
                error: "Provet hittades inte."
            });

        }

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
                    group_exam_key,
                    exam_config
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    group_id,
                    exam_id,
                    groupExamKey,
                    exam.exam_config
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
            g.name AS group_name,
            ep.role
        FROM group_exams ge

        JOIN exams e
            ON e.id = ge.exam_id

        JOIN groups g
            ON g.id = ge.group_id

        JOIN exam_permissions ep
            ON ep.exam_id = ge.exam_id

        WHERE ge.id = ?
            AND ep.teacher_id = ?
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

        waiting_room_open,
        max_attempts,

        available_from,
        available_until
    } = req.body;

    await db.query(
        `
        UPDATE group_exams
        SET
            exam_config = ?,

            waiting_room_open = ?,
            max_attempts = ?,

            available_from = ?,
            available_until = ?

        WHERE id = ?
        `,
        [
            JSON.stringify(
                exam_config || {}
            ),

            waiting_room_open,
            max_attempts,

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


// DELETE /api/group-exams/:id
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

// GET /api/group-exams/:id/preview
router.get("/:id/preview", async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const preview =
                await buildExamSession(
                    connection,
                    Number(req.params.id)
                );

            res.json(preview);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    error.message
            });

        } finally {

            connection.release();

        }

    }
);

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
                AND b.deleted_at IS NULL
            ORDER BY eb.sort_order
            `,
            [req.params.id]
        );

        const hydratedBlocks =
            await hydrateBlocks(blocks);

        res.json(hydratedBlocks);

    }
);

// GET /api/group-exams/:id/waiting-room
router.get("/:id/waiting-room", async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    u.id,
                    u.first_name,
                    u.last_name,
                    wr.joined_at

                FROM exam_waiting_room wr

                INNER JOIN users u
                    ON u.id = wr.user_id

                WHERE wr.group_exam_id = ?

                ORDER BY wr.joined_at
                `,
                [req.params.id]
            );

        res.json(rows);

    }
);

// GET /api/group-exams/:id/monitor
router.get("/:id/monitor", async (req, res) => {

    try {

        const [rows] = await db.query(
            `
            SELECT
                u.id AS user_id,
                u.first_name,
                u.last_name,

                ea.id AS attempt_id,
                ea.status,
                ea.started_at,
                ea.submitted_at,

                ea.started_ip,
                ea.started_user_agent,

                wr.joined_at,
                wr.admitted_at

            FROM group_students gs

            INNER JOIN users u
                ON u.id = gs.user_id

            INNER JOIN group_exams ge
                ON ge.group_id = gs.group_id

            LEFT JOIN exam_attempts ea
                ON ea.group_exam_id = ge.id
                AND ea.user_id = gs.user_id

            LEFT JOIN exam_waiting_room wr
                ON wr.group_exam_id = ge.id
                AND wr.user_id = gs.user_id

            WHERE ge.id = ?

            ORDER BY

            CASE
            
                WHEN wr.joined_at IS NULL
                    AND ea.status IS NULL
                THEN 2
                ELSE 1
            
            END,

                u.first_name,
                u.last_name
            `,
            [req.params.id]
        );

        console.log(
            JSON.stringify(rows, null, 2)
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                error.message ||
                "Kunde inte hämta övervakningsdata."
        });

    }

});


// POST /api/group-exams/:id/open-waiting-room
router.post("/:id/open-waiting-room", async (req, res) => {

    try {

        await db.query(
            `
            UPDATE group_exams
            SET waiting_room_open = 1
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte öppna väntrummet."
        });

    }

});

// POST /api/group-exams/:id/close-waiting-room
router.post("/:id/close-waiting-room", async (req, res) => {

    try {

        await db.query(
            `
            UPDATE group_exams
            SET waiting_room_open = 0
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte stänga väntrummet."
        });

    }

});

// POST /api/group-exams/:id/events
router.get("/:id/events", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT
            ee.id,
            ee.event_type,
            ee.created_at,

            u.first_name,
            u.last_name

        FROM exam_events ee

        INNER JOIN exam_attempts ea
            ON ea.id = ee.attempt_id

        INNER JOIN users u
            ON u.id = ea.user_id

        WHERE ea.group_exam_id = ?

        ORDER BY ee.created_at DESC

        LIMIT 100
        `,
        [req.params.id]
    );

    res.json(rows);

});

// POST /api/group-exams/:id/open
router.post("/:id/open", async (req, res) => {

    try {

        await db.query(
            `
            UPDATE group_exams
            SET exam_status = 'open'
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte öppna provet."
        });

    }

});

// POST /api/group-exams/:id/close
router.post("/:id/close", async (req, res) => {

    try {

        await db.query(
            `
            UPDATE group_exams
            SET exam_status = 'closed'
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte stänga provet."
        });

    }

});

// POST /api/group-exams/:id/admit-student
router.post("/:id/admit-student",
    async (req, res) => {

        const {
            user_id
        } = req.body;

        await db.query(
            `
            UPDATE exam_waiting_room
            SET admitted_at = NOW()
            WHERE
                group_exam_id = ?
                AND user_id = ?
            `,
            [
                req.params.id,
                user_id
            ]
        );

        res.json({
            success: true
        });

    }
);

// POST /api/group-exams/:id/admit-all
router.post("/:id/admit-all", async (req, res) => {

    await db.query(
        `
        UPDATE group_exams
        SET exam_status = 'open'
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.json({
        success: true
    });

});

// POST /api/group-exams/:id/terminate-all
router.post("/:id/terminate-all",
    async (req, res) => {

        const groupExamId =
            req.params.id;

        const [attempts] =
            await db.query(
                `
                SELECT id
                FROM exam_attempts
                WHERE
                    group_exam_id = ?
                    AND status = 'in_progress'
                `,
                [groupExamId]
            );

        await db.query(
            `
            UPDATE exam_attempts
            SET
                status = 'submitted',
                submitted_at = NOW()
            WHERE
                group_exam_id = ?
                AND status = 'in_progress'
            `,
            [groupExamId]
        );

        for (const attempt of attempts) {

            await db.query(
                `
                INSERT INTO exam_events (
                    attempt_id,
                    event_type
                )
                VALUES (?, ?)
                `,
                [
                    attempt.id,
                    "terminated_all_by_teacher"
                ]
            );

        }

        res.json({
            success: true
        });

    }
);


//GET /api/group-exams/:id/attempts

//POST /api/group-exams/:id/open
//POST /api/group-exams/:id/close

export default router
