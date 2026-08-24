import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/",
    requireAuth,
    async (req, res) => {

        if (req.user.role === "super") {

            const [schools] =
                await db.query(`
                    SELECT *
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
