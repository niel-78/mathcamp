import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);

router.get("/me/groups", async (req, res) => {

    if (req.user.role !== "student") {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    const [groups] = await db.query(
        `
        SELECT
            g.id,
            g.name,
            g.level_id,
            g.book_id,
            g.ability_series_id,
            gs.joined_at
        FROM group_students gs
        INNER JOIN \`groups\` g
            ON g.id = gs.group_id
        WHERE gs.user_id = ?
            AND gs.deleted_at IS NULL
            AND g.archived_at IS NULL
            AND g.deleted_at IS NULL
        ORDER BY
            gs.joined_at DESC,
            g.created_at DESC,
            g.id DESC
        `,
        [req.user.id]
    );

    res.json(groups);

});

router.get("/me/groups/:groupId/latest-result", async (req, res) => {

    if (req.user.role !== "student") {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    const groupId =
        Number(req.params.groupId);

    if (!Number.isInteger(groupId)) {
        return res.status(400).json({
            error: "Ogiltigt grupp-id."
        });
    }

    const [[membership]] = await db.query(
        `
        SELECT 1
        FROM group_students
        WHERE user_id = ?
            AND group_id = ?
            AND deleted_at IS NULL
        `,
        [
            req.user.id,
            groupId
        ]
    );

    if (!membership) {
        return res.status(403).json({
            error: "Du tillhör inte gruppen."
        });
    }

    const [[attempt]] = await db.query(
        `
        SELECT aa.id
        FROM assessment_attempts aa
        INNER JOIN group_assessments ga
            ON ga.id = aa.group_assessment_id
        WHERE aa.user_id = ?
            AND ga.group_id = ?
            AND (
                aa.status IN ('submitted', 'graded')
                OR aa.mode = 'test'
                OR EXISTS (
                    SELECT 1
                    FROM assessment_answers ans
                    WHERE ans.attempt_id = aa.id
                )
                OR EXISTS (
                    SELECT 1
                    FROM attempt_questions aq
                    WHERE aq.attempt_id = aa.id
                )
            )
        ORDER BY
            COALESCE(
                aa.submitted_at,
                aa.started_at,
                aa.created_at
            ) DESC,
            aa.created_at DESC
        LIMIT 1
        `,
        [
            req.user.id,
            groupId
        ]
    );

    if (!attempt) {
        return res.json({
            attempt_id: null
        });
    }

    res.json({
        attempt_id: attempt.id
    });

});

router.get("/me/groups/:groupId/attempts", async (req, res) => {

    if (req.user.role !== "student") {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    const groupId =
        Number(req.params.groupId);

    if (!Number.isInteger(groupId)) {
        return res.status(400).json({
            error: "Ogiltigt grupp-id."
        });
    }

    const [[membership]] = await db.query(
        `
        SELECT 1
        FROM group_students
        WHERE user_id = ?
            AND group_id = ?
            AND deleted_at IS NULL
        `,
        [
            req.user.id,
            groupId
        ]
    );

    if (!membership) {
        return res.status(403).json({
            error: "Du tillhör inte gruppen."
        });
    }

    const [attempts] = await db.query(
        `
        SELECT
            aa.id,
            aa.status,
            aa.mode,
            aa.started_at,
            aa.submitted_at,
            a.title
        FROM assessment_attempts aa
        INNER JOIN group_assessments ga
            ON ga.id = aa.group_assessment_id
        INNER JOIN assessments a
            ON a.id = ga.assessment_id
        WHERE aa.user_id = ?
            AND ga.group_id = ?
            AND (
                aa.status IN ('submitted', 'graded')
                OR aa.mode = 'test'
                OR EXISTS (
                    SELECT 1
                    FROM assessment_answers ans
                    WHERE ans.attempt_id = aa.id
                )
                OR EXISTS (
                    SELECT 1
                    FROM attempt_questions aq
                    WHERE aq.attempt_id = aa.id
                )
            )
        ORDER BY
            COALESCE(
                aa.submitted_at,
                aa.started_at,
                aa.created_at
            ) DESC,
            aa.created_at DESC
        `,
        [
            req.user.id,
            groupId
        ]
    );

    res.json(attempts);

});

router.get("/me/groups/:groupId/abilities", async (req, res) => {

    if (req.user.role !== "student") {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    const groupId =
        Number(req.params.groupId);

    if (!Number.isInteger(groupId)) {
        return res.status(400).json({
            error: "Ogiltigt grupp-id."
        });
    }

    const [[membership]] = await db.query(
        `
        SELECT 1
        FROM group_students
        WHERE user_id = ?
            AND group_id = ?
            AND deleted_at IS NULL
        `,
        [
            req.user.id,
            groupId
        ]
    );

    if (!membership) {
        return res.status(403).json({
            error: "Du tillhör inte gruppen."
        });
    }

    const [rows] = await db.query(
        `
        SELECT DISTINCT
            a.id,
            a.name,
            a.sort_order,
            asr.name AS series_name,
            COALESCE(sam.mastery_score, 50) AS mastery_score
        FROM group_students gs
        INNER JOIN \`groups\` g
            ON g.id = gs.group_id
        INNER JOIN ability_series asr
            ON asr.id = g.ability_series_id
        INNER JOIN abilities a
            ON a.series_id = asr.id
        LEFT JOIN student_ability_mastery sam
            ON sam.ability_id = a.id
            AND sam.user_id = ?
        WHERE gs.user_id = ?
            AND gs.group_id = ?
            AND gs.deleted_at IS NULL
            AND a.deleted_at IS NULL
        ORDER BY
            a.sort_order,
            a.name
        `,
        [
            req.user.id,
            req.user.id,
            groupId
        ]
    );

    const [[lastDiagnosticAttempt]] = await db.query(
        `
        SELECT aa.id
        FROM assessment_attempts aa
        INNER JOIN group_assessments ga
            ON ga.id = aa.group_assessment_id
        INNER JOIN assessments a
            ON a.id = ga.assessment_id
        WHERE aa.user_id = ?
            AND ga.group_id = ?
            AND a.type = 'diagnostic'
            AND aa.status = 'submitted'
            AND aa.mode != 'test'
        ORDER BY aa.submitted_at DESC
        LIMIT 1
        `,
        [
            req.user.id,
            groupId
        ]
    );

    const previousMasteryByAbility = new Map();

    if (lastDiagnosticAttempt) {

        const [historyRows] = await db.query(
            `
            SELECT
                ability_id,
                mastery_before
            FROM student_ability_history
            WHERE assessment_attempt_id = ?
            ORDER BY created_at ASC
            `,
            [lastDiagnosticAttempt.id]
        );

        for (const row of historyRows) {
            if (!previousMasteryByAbility.has(row.ability_id)) {
                previousMasteryByAbility.set(
                    row.ability_id,
                    Number(row.mastery_before)
                );
            }
        }

    }

    for (const ability of rows) {

        const previousScore =
            previousMasteryByAbility.get(ability.id);

        ability.previous_mastery_score =
            previousScore ?? null;

        ability.mastery_trend =
            previousScore == null
                ? "unchanged"
                : Number(ability.mastery_score) > previousScore
                    ? "up"
                    : Number(ability.mastery_score) < previousScore
                        ? "down"
                        : "unchanged";

    }

    res.json(rows);

});

router.use(requireRole("teacher","super"));

/*
GET    /api/students
POST   /api/students

GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id

GET    /api/students/:id/attempts
GET    /api/students/:id/results
GET    /api/students/:id/abilities

PUT    /api/students/:id/password
*/

// GET /api/students
router.get("/", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT
            id,
            username,
            first_name,
            last_name
        FROM users
        WHERE role = 'student'
        ORDER BY
            last_name,
            first_name
        `
    );

    res.json(rows);
});

// POST /api/students

// GET /api/students/:studentId
router.get("/:studentId", async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                id,
                username,
                first_name,
                last_name,
                display_name,
                user_key
            FROM users
            WHERE id = ?
            `,
            [req.params.studentId]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        res.json(rows[0]);

    }
);
// PUT /api/students/:studentId
router.put("/:studentId", async (req, res) => {

        const {
            first_name,
            last_name,
            display_name
        } = req.body;

        await db.query(
            `
            UPDATE users
            SET
                first_name = ?,
                last_name = ?,
                display_name = ?
            WHERE id = ?
            `,
            [
                first_name,
                last_name,
                display_name,
                req.params.studentId
            ]
        );

        res.sendStatus(204);

    }
);
// DELETE /api/students/:id

//PUT /api/students/:studentId/password
router.put("/:studentId/password",
    async (req, res) => {

        const studentId =
            Number(req.params.studentId);

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Ogiltigt elev-id."
            });
        }

        let { password } = req.body;

        if (!password?.trim()) {
            password = generatePassword();
        }

        const passwordHash =
            await bcrypt.hash(password, 12);

        await db.query(
            `
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            `,
            [
                passwordHash,
                studentId
            ]
        );

        res.json({
            password
        });
    }
);

// GET /api/students/:id/attempts
router.get("/:studentId/attempts", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT
            ea.id,
            ea.submitted_at,
            a.title
        FROM assessment_attempts ea
        INNER JOIN group_assessments ga
            ON ga.id = ea.group_assessment_id
        INNER JOIN assessments a
            ON a.id = ga.assessment_id
        INNER JOIN group_permissions gp
            ON gp.group_id = ga.group_id
        WHERE ea.user_id = ?
            AND ea.status = 'submitted'
            AND gp.user_id = ?
        ORDER BY ea.submitted_at DESC
        `,
        [req.params.studentId, req.user.id]
    );

    res.json(rows);

});

// GET /api/students/:id/abilities
router.get("/:studentId/abilities", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT DISTINCT
            a.id,
            a.name,
            a.sort_order,
            asr.name AS series_name,
            COALESCE(sam.mastery_score, 50) AS mastery_score
        FROM group_students gs
        INNER JOIN \`groups\` g
            ON g.id = gs.group_id
        INNER JOIN ability_series asr
            ON asr.id = g.ability_series_id
        INNER JOIN abilities a
            ON a.series_id = asr.id
        LEFT JOIN student_ability_mastery sam
            ON sam.ability_id = a.id
            AND sam.user_id = ?
        WHERE gs.user_id = ?
            AND gs.deleted_at IS NULL
            AND a.deleted_at IS NULL
        ORDER BY
            asr.name,
            a.sort_order,
            a.name
        `,
        [req.params.studentId, req.params.studentId]
    );

    const [[lastDiagnosticAttempt]] =
        await db.query(
            `
            SELECT aa.id
            FROM assessment_attempts aa
            INNER JOIN group_assessments ga
                ON ga.id = aa.group_assessment_id
            INNER JOIN assessments a
                ON a.id = ga.assessment_id
            WHERE aa.user_id = ?
                AND a.type = 'diagnostic'
                AND aa.status = 'submitted'
                AND aa.mode != 'test'
            ORDER BY aa.submitted_at DESC
            LIMIT 1
            `,
            [req.params.studentId]
        );

    const previousMasteryByAbility = new Map();

    if (lastDiagnosticAttempt) {

        const [historyRows] =
            await db.query(
                `
                SELECT
                    ability_id,
                    mastery_before
                FROM student_ability_history
                WHERE assessment_attempt_id = ?
                ORDER BY created_at ASC
                `,
                [lastDiagnosticAttempt.id]
            );

        for (const row of historyRows) {

            if (
                !previousMasteryByAbility.has(
                    row.ability_id
                )
            ) {

                previousMasteryByAbility.set(
                    row.ability_id,
                    Number(row.mastery_before)
                );

            }

        }

    }

    for (const ability of rows) {

        const previousScore =
            previousMasteryByAbility.get(
                ability.id
            );

        ability.previous_mastery_score =
            previousScore ?? null;

        ability.mastery_trend =

            previousScore == null

                ? "unchanged"

                : Number(ability.mastery_score) >
                    previousScore
                    ? "up"

                    : Number(ability.mastery_score) <
                        previousScore
                        ? "down"

                        : "unchanged";

    }

    res.json(rows);

});

// GET /api/students/:id/results

// GET /api/students/:id/events
router.get("/:id/students/:userId/events", async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    ee.*
                FROM assessment_events ee

                INNER JOIN assessment_attempts ea
                    ON ea.id = ee.attempt_id

                WHERE
                    ea.group_assessment_id = ?
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


export default router