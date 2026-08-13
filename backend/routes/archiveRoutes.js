import express from "express";
import db from "../db.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import getExamRole from "../utils/getExamRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

// GET /api/archive/groups
router.get("/groups", requireAuth,
    async (req, res) => {

        const [groups] =
            await db.query(
                `
                SELECT
                    g.*
                FROM groups g

                JOIN group_permissions gp
                    ON gp.group_id = g.id

                WHERE gp.teacher_id = ?
                AND gp.role = 'owner'
                AND g.archived_at IS NOT NULL
                AND g.deleted_at IS NULL

                ORDER BY g.name
                `,
                [req.user.id]
            );

        res.json(groups);

    }
);

//POST /api/archive/groups/:id/restore
router.post("/groups/:id/restore", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE groups
            SET archived_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/groups/:id
router.delete("/groups/:id", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE groups
            SET deleted_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// GET /api/archive/exams
router.get("/exams", requireAuth,
    async (req, res) => {

        const [exams] =
            await db.query(
                `
                SELECT
                    e.*
                FROM exams e

                JOIN exam_permissions ep
                    ON ep.exam_id = e.id

                WHERE ep.teacher_id = ?
                AND ep.role = 'owner'
                AND e.archived_at IS NOT NULL
                AND e.deleted_at IS NULL

                ORDER BY e.title
                `,
                [req.user.id]
            );

        res.json(exams);

    }
);

// POST /api/archive/exams/:id/restore
router.post("/exams/:id/restore", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE exams
            SET archived_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/exams/:id
router.delete("/exams/:id", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE exams
            SET deleted_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// GET /api/archive/students
router.get("/students", requireAuth,
    async (req, res) => {

        const [students] =
            await db.query(
                `
                SELECT
                    u.id,
                    u.first_name,
                    u.last_name,

                    g.id AS group_id,
                    g.name AS group_name,

                    gs.deleted_at

                FROM group_students gs

                JOIN users u
                    ON u.id = gs.user_id

                JOIN groups g
                    ON g.id = gs.group_id

                JOIN group_permissions gp
                    ON gp.group_id = g.id

                WHERE gp.teacher_id = ?
                AND gp.role = 'owner'
                AND gs.deleted_at IS NOT NULL

                ORDER BY gs.deleted_at DESC
                `,
                [req.user.id]
            );

        res.json(students);

    }
);

// POST /api/archive/students/restore
router.post("/students/restore", requireAuth,
    async (req, res) => {

        const {
            group_id,
            user_id
        } = req.body;

        await db.query(
            `
            UPDATE group_students
            SET deleted_at = NULL
            WHERE group_id = ?
            AND user_id = ?
            `,
            [
                group_id,
                user_id
            ]
        );

        res.sendStatus(204);

    }
);

// GET /api/archive/blocks
router.get("/blocks", requireAuth,
    async (req, res) => {

        const [blocks] =
            await db.query(
                `
                SELECT
                    b.*
                FROM blocks b

                WHERE b.created_by = ?
                AND b.archived_at IS NOT NULL
                AND b.deleted_at IS NULL

                ORDER BY b.updated_at DESC
                `,
                [req.user.id]
            );

        res.json(blocks);

    }
);

// POST /api/archive/blocks/:id/restore
router.post("/blocks/:id/restore", requireAuth,
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT id
                FROM blocks
                WHERE id = ?
                AND created_by = ?
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );

        if (!rows.length) {
            return res.sendStatus(403);
        }

        await db.query(
            `
            UPDATE blocks
            SET archived_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/blocks/:id
router.delete("/blocks/:id", requireAuth,
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT id
                FROM blocks
                WHERE id = ?
                AND created_by = ?
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );

        if (!rows.length) {
            return res.sendStatus(403);
        }

        await db.query(
            `
            UPDATE blocks
            SET deleted_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// GET /api/archive/questions
router.get("/questions",requireAuth,
    async (req, res) => {

        const [questions] =
            await db.query(
                `
                SELECT
                    q.*,

                    b.id AS block_id

                FROM questions q

                JOIN blocks b
                    ON b.id = q.block_id

                WHERE q.archived_at IS NOT NULL
                AND q.deleted_at IS NULL
                AND b.created_by = ?

                ORDER BY q.updated_at DESC
                `,
                [req.user.id]
            );

        res.json(questions);

    }
);

// POST /api/archive/questions/:id/restore
router.post("/questions/:id/restore", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE questions
            SET archived_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/questions/:id
router.delete("/questions/:id", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE questions
            SET deleted_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

export default router
