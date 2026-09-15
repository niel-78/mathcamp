import express from "express";
import db from "../db.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import getExamRole from "../utils/getAssessmentRole.js";

const router = express.Router();

async function hydrateArchivedQuestions(questions) {
    const questionIds = questions.map(question => question.id);

    if (!questionIds.length) {
        return;
    }

    const [options] = await db.query(
        `
        SELECT *
        FROM options
        WHERE question_id IN (?)
        AND deleted_at IS NULL
        ORDER BY question_id, sort_order
        `,
        [questionIds]
    );

    const optionsByQuestionId = new Map();

    for (const option of options) {
        const questionOptions =
            optionsByQuestionId.get(option.question_id) || [];

        questionOptions.push(option);
        optionsByQuestionId.set(option.question_id, questionOptions);
    }

    for (const question of questions) {
        question.options =
            optionsByQuestionId.get(question.id) || [];
    }
}

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
                FROM \`groups\` g

                JOIN group_permissions gp
                    ON gp.group_id = g.id

                WHERE gp.user_id = ?
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

router.get("/groups/trash", requireAuth,
    async (req, res) => {

        const [groups] =
            await db.query(
                `
                SELECT
                    g.*
                FROM \`groups\` g

                JOIN group_permissions gp
                    ON gp.group_id = g.id

                WHERE gp.user_id = ?
                AND gp.role = 'owner'
                AND g.deleted_at IS NOT NULL

                ORDER BY g.deleted_at DESC
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
            SET archived_at = NULL,
                deleted_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/`groups`/:id
router.delete("/`groups`/:id", requireAuth,
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

// GET /api/archive/assessments
router.get("/assessments", requireAuth,
    async (req, res) => {

        const [assessments] =
            await db.query(
                `
                SELECT
                    e.*
                FROM assessments e

                JOIN assessment_permissions ep
                    ON ep.assessment_id = e.id

                WHERE ep.user_id = ?
                AND ep.role = 'owner'
                AND e.archived_at IS NOT NULL
                AND e.deleted_at IS NULL

                ORDER BY e.title
                `,
                [req.user.id]
            );

        res.json(assessments);

    }
);

// GET /api/archive/assessments/trash
router.get("/assessments/trash", requireAuth,
    async (req, res) => {

        const [assessments] =
            await db.query(
                `
                SELECT
                    e.*
                FROM assessments e

                JOIN assessment_permissions ep
                    ON ep.assessment_id = e.id

                WHERE ep.user_id = ?
                AND ep.role = 'owner'
                AND e.deleted_at IS NOT NULL

                ORDER BY e.deleted_at DESC
                `,
                [req.user.id]
            );

        res.json(assessments);

    }
);

// POST /api/archive/assessments/:id/restore
router.post("/assessments/:id/restore", requireAuth,
    async (req, res) => {

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
                    req.params.id,
                    req.user.id
                ]
            );

        if (!permissions.length) {
            await db.query(
                `
                INSERT INTO assessment_permissions (
                    assessment_id,
                    user_id,
                    role
                )
                VALUES (?, ?, 'owner')
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );
        }

        await db.query(
            `
            UPDATE assessments
            SET
                archived_at = NULL,
                deleted_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/assessments/:id
router.delete("/assessments/:id", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE assessments
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

                JOIN \`groups\` g
                    ON g.id = gs.group_id

                JOIN group_permissions gp
                    ON gp.group_id = g.id

                WHERE gp.user_id = ?
                AND gp.role = 'owner'
                AND gs.deleted_at IS NOT NULL

                ORDER BY gs.deleted_at DESC
                `,
                [req.user.id]
            );

        res.json(students);

    }
);

router.get("/students/trash", requireAuth,
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
                    gs.joined_at AS created_at,
                    gs.joined_at AS created_at,
                    gs.deleted_at
                FROM group_students gs
                JOIN users u ON u.id = gs.user_id
                JOIN \`groups\` g ON g.id = gs.group_id
                JOIN group_permissions gp ON gp.group_id = g.id
                WHERE gp.user_id = ?
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

        await hydrateBlocks(blocks);

        res.json(blocks);

    }
);

router.get("/blocks/trash", requireAuth,
    async (req, res) => {

        const [blocks] =
            await db.query(
                `
                SELECT b.*
                FROM blocks b
                WHERE b.created_by = ?
                AND b.deleted_at IS NOT NULL
                ORDER BY b.deleted_at DESC
                `,
                [req.user.id]
            );

        await hydrateBlocks(blocks);

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
            SET archived_at = NULL,
                deleted_at = NULL
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
                    b.id AS block_id,
                    ql.name AS level_name,
                    (
                        SELECT COUNT(*)
                        FROM question_reports qr
                        WHERE qr.question_id = q.id
                        AND qr.report_type = 'missing_correct_option'
                    ) AS report_count,
                    (
                        SELECT GROUP_CONCAT(
                            DISTINCT b2.title
                            ORDER BY b2.title
                            SEPARATOR ', '
                        )
                        FROM block_sections bs2
                        JOIN sections s2 ON s2.id = bs2.section_id
                        JOIN subchapters sc2 ON sc2.id = s2.subchapter_id
                        JOIN chapters c2 ON c2.id = sc2.chapter_id
                        JOIN books b2 ON b2.id = c2.book_id
                        WHERE bs2.block_id = b.id
                    ) AS book_names,
                    (
                        SELECT GROUP_CONCAT(
                            DISTINCT l2.name
                            ORDER BY l2.name
                            SEPARATOR ', '
                        )
                        FROM block_sections bs3
                        JOIN sections s3 ON s3.id = bs3.section_id
                        JOIN subchapters sc3 ON sc3.id = s3.subchapter_id
                        JOIN chapters c3 ON c3.id = sc3.chapter_id
                        JOIN books b3 ON b3.id = c3.book_id
                        JOIN level_books lb3 ON lb3.book_id = b3.id
                        JOIN levels l2 ON l2.id = lb3.level_id
                        WHERE bs3.block_id = b.id
                    ) AS course_names

                FROM questions q

                JOIN blocks b
                    ON b.id = q.block_id

                LEFT JOIN question_levels ql
                    ON ql.id = q.level_id

                WHERE q.archived_at IS NOT NULL
                AND q.deleted_at IS NULL
                AND b.created_by = ?

                ORDER BY q.updated_at DESC
                `,
                [req.user.id]
            );

        await hydrateArchivedQuestions(questions);

        res.json(questions);

    }
);

router.get("/questions/trash", requireAuth,
    async (req, res) => {

        const [questions] =
            await db.query(
                `
                SELECT
                    q.*,
                    b.id AS block_id,
                    ql.name AS level_name,
                    (
                        SELECT COUNT(*)
                        FROM question_reports qr
                        WHERE qr.question_id = q.id
                        AND qr.report_type = 'missing_correct_option'
                    ) AS report_count,
                    (
                        SELECT GROUP_CONCAT(
                            DISTINCT b2.title
                            ORDER BY b2.title
                            SEPARATOR ', '
                        )
                        FROM block_sections bs2
                        JOIN sections s2 ON s2.id = bs2.section_id
                        JOIN subchapters sc2 ON sc2.id = s2.subchapter_id
                        JOIN chapters c2 ON c2.id = sc2.chapter_id
                        JOIN books b2 ON b2.id = c2.book_id
                        WHERE bs2.block_id = b.id
                    ) AS book_names,
                    (
                        SELECT GROUP_CONCAT(
                            DISTINCT l2.name
                            ORDER BY l2.name
                            SEPARATOR ', '
                        )
                        FROM block_sections bs3
                        JOIN sections s3 ON s3.id = bs3.section_id
                        JOIN subchapters sc3 ON sc3.id = s3.subchapter_id
                        JOIN chapters c3 ON c3.id = sc3.chapter_id
                        JOIN books b3 ON b3.id = c3.book_id
                        JOIN level_books lb3 ON lb3.book_id = b3.id
                        JOIN levels l2 ON l2.id = lb3.level_id
                        WHERE bs3.block_id = b.id
                    ) AS course_names
                FROM questions q
                JOIN blocks b ON b.id = q.block_id
                LEFT JOIN question_levels ql ON ql.id = q.level_id
                WHERE q.deleted_at IS NOT NULL
                AND b.created_by = ?
                ORDER BY q.deleted_at DESC
                `,
                [req.user.id]
            );

        await hydrateArchivedQuestions(questions);

        res.json(questions);

    }
);

// POST /api/archive/questions/:id/restore
router.post("/questions/:id/restore", requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE questions
            SET archived_at = NULL,
                deleted_at = NULL
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

// GET /api/archive/presentations
router.get("/presentations",
    requireAuth,
    async (req, res) => {

        const [presentations] =
            await db.query(
                `
                SELECT *
                FROM presentations
                WHERE created_by = ?
                AND archived_at IS NOT NULL
                AND deleted_at IS NULL
                ORDER BY title
                `,
                [req.user.id]
            );

        res.json(presentations);

    }
);

router.get("/presentations/trash",
    requireAuth,
    async (req, res) => {

        const [presentations] =
            await db.query(
                `
                SELECT *
                FROM presentations
                WHERE created_by = ?
                AND deleted_at IS NOT NULL
                ORDER BY deleted_at DESC
                `,
                [req.user.id]
            );

        res.json(presentations);

    }
);

// POST /api/archive/presentations/:id/restore
router.post("/presentations/:id/restore",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE presentations
            SET
                archived_at = NULL,
                deleted_at = NULL,
                section_id = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/archive/presentations/:id
router.delete("/presentations/:id",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE presentations
            SET deleted_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

router.delete("/groups/:id/permanent", requireAuth,
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT g.id
            FROM \`groups\` g
            JOIN group_permissions gp ON gp.group_id = g.id
            WHERE g.id = ?
            AND g.deleted_at IS NOT NULL
            AND gp.user_id = ?
            AND gp.role = 'owner'
            `,
            [req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        try {
            await db.query(
                "DELETE FROM \`groups\` WHERE id = ?",
                [req.params.id]
            );
            res.sendStatus(204);
        } catch (error) {
            res.status(409).json({
                error: "Gruppen har kvarvarande kopplingar"
            });
        }

    }
);

router.delete("/students/permanent", requireAuth,
    async (req, res) => {

        const { group_id, user_id } = req.body;

        const [rows] = await db.query(
            `
            SELECT gs.user_id
            FROM group_students gs
            JOIN group_permissions gp ON gp.group_id = gs.group_id
            WHERE gs.group_id = ?
            AND gs.user_id = ?
            AND gs.deleted_at IS NOT NULL
            AND gp.user_id = ?
            AND gp.role = 'owner'
            `,
            [group_id, user_id, req.user.id]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        await db.query(
            `
            DELETE FROM group_students
            WHERE group_id = ?
            AND user_id = ?
            `,
            [group_id, user_id]
        );

        res.sendStatus(204);

    }
);

router.delete("/blocks/:id/permanent", requireAuth,
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT id
            FROM blocks
            WHERE id = ?
            AND created_by = ?
            AND deleted_at IS NOT NULL
            `,
            [req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        try {
            await db.query(
                "DELETE FROM blocks WHERE id = ?",
                [req.params.id]
            );
            res.sendStatus(204);
        } catch (error) {
            res.status(409).json({
                error: "Blocket har kvarvarande kopplingar"
            });
        }

    }
);

router.delete("/questions/:id/permanent", requireAuth,
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT q.id
            FROM questions q
            JOIN blocks b ON b.id = q.block_id
            WHERE q.id = ?
            AND q.deleted_at IS NOT NULL
            AND b.created_by = ?
            `,
            [req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        try {
            await db.query(
                "DELETE FROM questions WHERE id = ?",
                [req.params.id]
            );
            res.sendStatus(204);
        } catch (error) {
            res.status(409).json({
                error: "Uppgiften har kvarvarande kopplingar"
            });
        }

    }
);

router.delete("/assessments/:id/permanent", requireAuth,
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT e.id
            FROM assessments e
            JOIN assessment_permissions ep ON ep.assessment_id = e.id
            WHERE e.id = ?
            AND e.deleted_at IS NOT NULL
            AND ep.user_id = ?
            AND ep.role = 'owner'
            `,
            [req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        await db.query(
            "DELETE FROM assessments WHERE id = ?",
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

router.delete("/presentations/:id/permanent", requireAuth,
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT id
            FROM presentations
            WHERE id = ?
            AND created_by = ?
            AND deleted_at IS NOT NULL
            `,
            [req.params.id, req.user.id]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        await db.query(
            "DELETE FROM presentations WHERE id = ?",
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

export default router
