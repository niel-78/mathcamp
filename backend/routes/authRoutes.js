import requireAuth from "../middleware/requireAuth.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../db.js";
import express from "express";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/*
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
*/

// POST /api/auth/login
router.post("/login", async (req, res) => {

    try {

        const { username, password, program_version } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                error: "Missing fields"
            });
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM users
            WHERE username = ?
            `,
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: "User not found"
            });
        }

        const user = rows[0];

        const valid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!valid) {
            return res.status(401).json({
                error: "Wrong password"
            });
        }

        const token = crypto.randomUUID();

        await db.query(
            `
            INSERT INTO user_sessions (
                user_id,
                session_token,
                program_version
            )
            VALUES (?, ?, ?)
            `,
            [user.id, token, program_version || null]
        );

        const [[school]] = await db.query(
            `
            SELECT
                s.id,
                s.name,
                st.is_admin
            FROM school_teachers st
            INNER JOIN schools s
                ON s.id = st.school_id
            WHERE st.teacher_id = ?
            `,
            [user.id]
        );

        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                school: school
                    ? {
                        id: school.id,
                        name: school.name,
                        is_admin: !!school.is_admin
                    }
                    : null
            }
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }

});

//POST /api/auth/logout
router.post("/logout",
    requireAuth,
    async (req, res) => {

        const token =
            req.headers.authorization?.replace(/^Bearer\s+/i, "");

        await db.query(
            `
            UPDATE user_sessions
            SET
                logged_out_at = NOW()
            WHERE session_token = ?
            `,
            [token]
        );

        res.json({
            success: true
        });

    }
);

// GET /api/auth/me
router.get("/me", requireAuth,
    async (req, res) => {

        const [[school]] =
            await db.query(
                `
                SELECT
                    s.id,
                    s.name,
                    st.is_admin
                FROM school_teachers st
                INNER JOIN schools s
                    ON s.id = st.school_id
                WHERE st.teacher_id = ?
                `,
                [req.user.id]
            );

        res.json({

            id: req.user.id,
            username: req.user.username,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            role: req.user.role,

            school: school
                ? {
                    id: school.id,
                    name: school.name,
                    is_admin: !!school.is_admin
                }
                : null

        });

    }
);

// POST /api/auth/sessions
router.get("/sessions", requireAuth,
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    id,
                    DATE_FORMAT(
                        logged_in_at,
                        '%Y-%m-%dT%H:%i:%s.000Z'
                    ) AS logged_in_at,
                    DATE_FORMAT(
                        logged_out_at,
                        '%Y-%m-%dT%H:%i:%s.000Z'
                    ) AS logged_out_at,
                    program_version
                FROM user_sessions
                WHERE user_id = ?
                ORDER BY logged_in_at DESC
                LIMIT 20
                `,
                [req.user.id]
            );

        res.json(rows);

    }
);

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
        const { username } = req.body || {};

        if (!username) {
            return res.status(400).json({
                error: "Ange ett användarnamn"
            });
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM users
            WHERE username = ?
            `,
            [username]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Användaren hittades inte"
            });
        }

        const user = rows[0];

        if (!user.email) {
            return res.status(400).json({
                error: "Ingen e-postadress är registrerad på detta konto"
            });
        }

        // Generera ett nytt tillfälligt slumpmässigt lösenord (t.ex. 8 tecken)
        const newPassword = crypto.randomBytes(4).toString("hex");
        const password_hash = await bcrypt.hash(newPassword, 10);

        // Uppdatera lösenordet i databasen
        await db.query(
            `
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            `,
            [password_hash, user.id]
        );

        await sendEmail(
            user.email,
            "Ditt nya tillfälliga lösenord",
            `Hej ${user.first_name},\n\nDitt nya tillfälliga lösenord är: ${newPassword}\n\nLogga in och byt det i din profil.`
        );

        console.log(`Nytt lösenord för ${username}: ${newPassword}`);

        res.json({
            success: true,
            message: "Ett nytt lösenord har skickats till din e-post."
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
});


export default router;