import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import multer from "multer";
import XLSX from "xlsx";
import crypto from "crypto";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});

router.use(requireAuth);
router.use(requireRole("teacher"));

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


// GET /api/groups/:id/students
router.get("/:id/students", async (req, res) => {
    try {

        const [students] = await db.query(
            `
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                gs.joined_at
            FROM group_students gs
            INNER JOIN users u
                ON u.id = gs.user_id
            WHERE gs.group_id = ?
            AND u.role = 'student'
            ORDER BY u.last_name, u.first_name
            `,
            [req.params.id]
        );

        res.json({
            students
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte hämta gruppens elever."
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
            INSERT INTO group_students (
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
            id: userResult.insertId,
            password: password 
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte skapa elev."
        });

    }
});
// DELETE /api/groups/:id/students/:studentId
router.delete("/:id/students/:studentId", async (req, res) => {
    try {

        const [result] = await db.query(
            `
            DELETE FROM group_students
            WHERE group_id = ?
              AND user_id = ?
            `,
            [
                req.params.id,
                req.params.studentId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Eleven finns inte i gruppen."
            });
        }

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte ta bort eleven från gruppen."
        });

    }
});

// POST /api/groups/:id/import-students
router.post("/:id/import-students",
    upload.single("file"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Ingen fil uppladdad"
                });
            }

            const workbook = XLSX.read(
                req.file.buffer
            );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(sheet);

            const imported = [];

            for (const row of rows) {

                const firstName =
                    row.Förnamn?.trim();

                const lastName =
                    row.Efternamn?.trim();

                if (
                    !firstName ||
                    !lastName
                ) {
                    continue;
                }

                let username =
                    (
                        firstName.toLowerCase() +
                        "." +
                        lastName.toLowerCase()
                    )
                    .replace(/å/g, "a")
                    .replace(/ä/g, "a")
                    .replace(/ö/g, "o")
                    .replace(/\s+/g, "");


                let counter = 1;

                while (true) {

                    const [[existing]] = await db.query(
                        `
                        SELECT id
                        FROM users
                        WHERE username = ?
                        `,
                        [username]
                    );

                    if (!existing) {
                        break;
                    }

                    counter++;

                    username =
                        (
                            firstName.toLowerCase() +
                            "." +
                            lastName.toLowerCase()
                        )
                        .replace(/å/g, "a")
                        .replace(/ä/g, "a")
                        .replace(/ö/g, "o")
                        .replace(/\s+/g, "")
                        + counter;
                }

                const password = generatePassword();
                
                const passwordHash =
                    await bcrypt.hash(
                        password,
                        10
                    );

                const userKey =
                    crypto.randomUUID();

                const [userResult] =
                    await db.query(
                        `
                        INSERT INTO users (
                            username,
                            password_hash,
                            role,
                            first_name,
                            last_name,
                            user_key
                        )
                        VALUES (
                            ?,
                            ?,
                            'student',
                            ?,
                            ?,
                            ?
                        )
                        `,
                        [
                            username,
                            passwordHash,
                            firstName,
                            lastName,
                            userKey
                        ]
                    );

                await db.query(
                    `
                    INSERT INTO group_students (
                        user_id,
                        group_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        userResult.insertId,
                        req.params.id
                    ]
                );

                imported.push({
                    id: userResult.insertId,
                    firstName,
                    lastName,
                    username,
                    password: password
                });

            }

            res.json({
                importedCount:
                    imported.length,
                students:
                    imported
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Importen misslyckades"
            });

        }

    }
);

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
