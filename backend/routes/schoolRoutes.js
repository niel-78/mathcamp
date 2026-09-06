import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

async function canManageSchoolStaff(
    user,
    schoolId
) {

    if (user.role === "super") {
        return true;
    }

    const [[membership]] = await db.query(
        `
        SELECT is_admin
        FROM school_teachers
        WHERE school_id = ?
            AND teacher_id = ?
        `,
        [
            schoolId,
            user.id
        ]
    );

    return !!membership?.is_admin;

}

router.get("/",
    requireAuth,
    async (req, res) => {

        if (req.user.role === "super") {

            const [schools] =
                await db.query(`
                    SELECT
                        *,
                        TRUE AS is_admin
                    FROM schools
                    ORDER BY name
                `);

            return res.json(schools);

        }

        const [schools] =
            await db.query(
                `
                SELECT
                    s.*,
                    st.is_admin
                FROM school_teachers st
                INNER JOIN schools s
                    ON s.id = st.school_id
                WHERE st.teacher_id = ?
                ORDER BY s.name
                `,
                [req.user.id]
            );

        res.json(schools);

    }
);

router.get("/:schoolId/staff",
    requireAuth,
    async (req, res) => {

        const schoolId =
            Number(req.params.schoolId);

        if (!Number.isInteger(schoolId)) {
            return res.status(400).json({
                error: "Ogiltigt skol-id."
            });
        }

        if (!await canManageSchoolStaff(req.user, schoolId)) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        const [staff] = await db.query(
            `
            SELECT
                u.id,
                u.username,
                u.first_name,
                u.last_name,
                st.is_admin
            FROM school_teachers st
            INNER JOIN users u
                ON u.id = st.teacher_id
            WHERE st.school_id = ?
                AND u.deleted_at IS NULL
            ORDER BY
                u.last_name,
                u.first_name,
                u.username
            `,
            [schoolId]
        );

        res.json(staff);

    }
);

router.post("/:schoolId/staff",
    requireAuth,
    async (req, res) => {

        const schoolId =
            Number(req.params.schoolId);

        if (!Number.isInteger(schoolId)) {
            return res.status(400).json({
                error: "Ogiltigt skol-id."
            });
        }

        if (!await canManageSchoolStaff(req.user, schoolId)) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        const {
            username,
            first_name,
            last_name,
            email
        } = req.body || {};

        if (!username?.trim()) {
            return res.status(400).json({
                error: "Användarnamn saknas."
            });
        }

        const password = generatePassword();
        const passwordHash =
            await bcrypt.hash(password, 12);

        const connection =
            await db.getConnection();

        try {

            await connection.beginTransaction();

            const [userResult] = await connection.query(
                `
                INSERT INTO users (
                    username,
                    password_hash,
                    role,
                    first_name,
                    last_name,
                    email
                )
                VALUES (?, ?, 'teacher', ?, ?, ?)
                `,
                [
                    username.trim(),
                    passwordHash,
                    first_name || null,
                    last_name || null,
                    email || null
                ]
            );

            await connection.query(
                `
                INSERT INTO school_teachers (
                    school_id,
                    teacher_id,
                    is_admin
                )
                VALUES (?, ?, 0)
                `,
                [
                    schoolId,
                    userResult.insertId
                ]
            );

            await connection.commit();

            res.status(201).json({
                id: userResult.insertId,
                password
            });

        } catch (error) {

            await connection.rollback();

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    error: "Användarnamnet finns redan."
                });
            }

            console.error(error);

            res.status(500).json({
                error: "Kunde inte skapa personal."
            });

        } finally {

            connection.release();

        }

    }
);

router.get("/:schoolId/groups",
    requireAuth,
    async (req, res) => {

        const [groups] =
            await db.query(
                `
                SELECT
                    id,
                    name
                FROM \`groups\`
                WHERE school_id = ?
                ORDER BY name
                `,
                [req.params.schoolId]
            );

        res.json(groups);

    }
);

export default router;
