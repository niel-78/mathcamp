import requireAuth from "../middleware/requireAuth.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../db.js";
import express from "express";
import { sendEmail } from "../utils/sendEmail.js";
import { getUserEmail, serializeAuthUser } from "../utils/authUser.js";

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
            SELECT
                *,
                COALESCE(
                    NULLIF(email, ''),
                    CASE
                        WHEN role = 'student'
                            THEN CONCAT(username, '@elev.ga.dbgy.se')
                        ELSE NULL
                    END
                ) AS delivery_email
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
            user: serializeAuthUser(
                {
                    ...user,
                    email: user.email || user.delivery_email || null
                },
                school
                    ? {
                        id: school.id,
                        name: school.name,
                        is_admin: !!school.is_admin
                    }
                    : null
            )
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }

});

// POST /api/auth/request-login-link
router.post("/request-login-link", async (req, res) => {
    try {
        const username = req.body?.username?.trim();

        if (username) {
            const [[user]] = await db.query(
                `
                SELECT id, username, first_name, email
                FROM users
                WHERE username = ?
                    AND deleted_at IS NULL
                LIMIT 1
                `,
                [username]
            );

            if (user?.email) {
                const rawToken = crypto.randomBytes(32).toString("hex");
                const tokenHash = crypto
                    .createHash("sha256")
                    .update(rawToken)
                    .digest("hex");

                await db.query(
                    `
                    DELETE FROM login_link_tokens
                    WHERE user_id = ?
                        AND used_at IS NULL
                    `,
                    [user.id]
                );

                await db.query(
                    `
                    INSERT INTO login_link_tokens (
                        user_id,
                        token_hash,
                        expires_at
                    )
                    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
                    `,
                    [user.id, tokenHash]
                );

                const appUrl = process.env.APP_URL || "https://mathcamp.one";

                await sendEmail(
                    user.email,
                    "Din inloggningslänk till MathCamp",
                    `Hej ${user.first_name || user.username},\n\nÖppna länken för att logga in på MathCamp:\n\n${appUrl}/?login_token=${rawToken}\n\nLänken gäller i 15 minuter och kan bara användas en gång.`
                );
            }
        }

        res.json({
            message: "Om kontot har en registrerad emailadress skickas en inloggningslänk dit."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Kunde inte skicka inloggningslänk."
        });
    }
});

// POST /api/auth/login-with-link
router.post("/login-with-link", async (req, res) => {
    const rawToken = req.body?.token;

    if (!rawToken || typeof rawToken !== "string") {
        return res.status(400).json({ error: "Ogiltig inloggningslänk." });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [[loginToken]] = await connection.query(
            `
            SELECT
                llt.id,
                llt.user_id,
                u.username,
                u.first_name,
                u.last_name,
                u.role
            FROM login_link_tokens llt
            INNER JOIN users u
                ON u.id = llt.user_id
            WHERE llt.token_hash = ?
                AND llt.used_at IS NULL
                AND llt.expires_at > NOW()
                AND u.deleted_at IS NULL
            LIMIT 1
            FOR UPDATE
            `,
            [tokenHash]
        );

        if (!loginToken) {
            await connection.rollback();
            return res.status(401).json({
                error: "Länken är ogiltig eller har gått ut."
            });
        }

        await connection.query(
            `
            UPDATE login_link_tokens
            SET used_at = NOW()
            WHERE id = ?
            `,
            [loginToken.id]
        );

        const sessionToken = crypto.randomUUID();

        await connection.query(
            `
            INSERT INTO user_sessions (
                user_id,
                session_token,
                program_version
            )
            VALUES (?, ?, ?)
            `,
            [loginToken.user_id, sessionToken, req.body?.program_version || null]
        );

        await connection.commit();

        res.json({
            token: sessionToken,
            user: serializeAuthUser(
                {
                    id: loginToken.user_id,
                    username: loginToken.username,
                    first_name: loginToken.first_name,
                    last_name: loginToken.last_name,
                    role: loginToken.role,
                    email: loginToken.email || null
                },
                null
            )
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Kunde inte logga in med länken." });
    } finally {
        connection.release();
    }
});

//POST /api/auth/logout
router.post("/logout",
    requireAuth,
    async (req, res) => {

        const token =
            req.headers.authorization?.replace(/^Bearer\s+/i, "");

        const [[session]] = await db.query(
            `
            SELECT id
            FROM user_sessions
            WHERE session_token = ?
            LIMIT 1
            `,
            [token]
        );

        if (session) {
            await db.query(
                `
                INSERT INTO user_session_events (
                    session_id,
                    event_type,
                    event_data
                )
                VALUES (?, 'logged_out', ?)
                `,
                [session.id, JSON.stringify({})]
            );

            await db.query(
                `
                UPDATE user_sessions
                SET logged_out_at = NOW()
                WHERE id = ?
                `,
                [session.id]
            );
        }

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

        res.json(
            serializeAuthUser(
                {
                    id: req.user.id,
                    username: req.user.username,
                    first_name: req.user.first_name,
                    last_name: req.user.last_name,
                    role: req.user.role,
                    email: req.user.email || null
                },
                school
                    ? {
                        id: school.id,
                        name: school.name,
                        is_admin: !!school.is_admin
                    }
                    : null
            )
        );

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
        const email = getUserEmail(user);

        if (!email) {
            return res.status(400).json({
                error: "Ingen e-postadress är registrerad på detta konto"
            });
        }

        // Generera ett nytt tillfälligt slumpmässigt lösenord (t.ex. 8 tecken)
        const newPassword = crypto.randomBytes(4).toString("hex");
        const password_hash = await bcrypt.hash(newPassword, 10);

        // Uppdatera lösenordet i databasen
        await sendEmail(
            email,
            "Ditt nya tillfälliga lösenord",
            `Hej ${user.first_name},\n\nDitt nya tillfälliga lösenord är: ${newPassword}\n\nLogga in och byt det i din profil.`
        );

        await db.query(
            `
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            `,
            [password_hash, user.id]
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