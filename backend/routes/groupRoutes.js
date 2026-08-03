import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

/*
GET    /api/groups
POST   /api/groups

GET    /api/groups/:id
PUT    /api/groups/:id
DELETE /api/groups/:id

GET    /api/groups/:id/students
POST   /api/groups/:id/students
DELETE /api/groups/:id/students/:studentId

GET    /api/groups/:id/group-exams

PUT    /api/groups/:id/archive
*/

// GET /api/groups
router.get("/", async (req, res) => {

    const [groups] = await db.query(`
        SELECT *
        FROM groups
        WHERE archived IS false
    `);

    res.json(groups);

});
// POST /api/groups
router.post("/", async (req, res) => {
    const { name } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO groups (name)
        VALUES (?)
        `,
        [name]
    );

    res.status(201).json({
        id: result.insertId,
        name
    });
});

// GET /api/groups/:id
router.get("/:id", async (req, res) => {
    try {

        const [groupRows] = await db.query(
            `
            SELECT *
            FROM groups
            WHERE id = ?
            `,
            [req.params.id]
        );

        if (groupRows.length === 0) {
            return res.status(404).json({
                error: "Gruppen hittades inte."
            });
        }

        const [students] = await db.query(
            `
            SELECT
                u.id,
                u.first_name,
                u.last_name
            FROM group_users gu
            INNER JOIN users u
                ON u.id = gu.user_id
            WHERE gu.group_id = ?
            AND u.role = 'student'
            ORDER BY u.last_name, u.first_name
            `,
            [req.params.id]
        );

        res.json({
            ...groupRows[0],
            students
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte hämta gruppen."
        });

    }
});
// PUT /api/groups/:id
router.put("/:id", async (req, res) => {

    try {

        const {
            name,
            description
        } = req.body;

        await db.query(
            `
            UPDATE groups
            SET
                name = ?,
                description = ?
            WHERE id = ?
            `,
            [
                name,
                description,
                req.params.id
            ]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte uppdatera gruppen."
        });

    }

});

// POST /api/groups/:id/students
router.post("/:id/students", async (req, res) => {
    try {

        const {
            username,
            first_name,
            last_name
        } = req.body;

        const password = generatePassword();


        const password_hash =
            await bcrypt.hash(password, 12);


        const [userResult] = await db.query(
            `
            INSERT INTO users (
                username,
                password_hash,
                role,
                first_name,
                last_name
            )
            VALUES (?, ?, 'student', ?, ?)
            `,
            [
                username,
                password_hash,
                first_name,
                last_name
            ]
        );

        await db.query(
            `
            INSERT INTO group_users (
                group_id,
                user_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.id,
                userResult.insertId
            ]
        );

        res.status(201).json({
            id: userResult.insertId
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte skapa elev."
        });

    }
});

//PUT /api/groups/:id/archive
router.put("/:id/archive", async (req, res) => {
    try {

        await db.query(
            `
            UPDATE groups
            SET archived = TRUE
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte arkivera gruppen."
        });

    }
});


export default router
