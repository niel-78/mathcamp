import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

// PUT /api/users/active-school
router.put("/active-school",
    async (req, res) => {

        const { school_id } = req.body;

        if (!school_id) {

            return res.status(400).json({
                error: "school_id saknas."
            });

        }

        /*
         * Kontrollera att användaren
         * tillhör skolan.
         */
        const [[membership]] =
            await db.query(
                `
                SELECT 1
                FROM school_teachers
                WHERE school_id = ?
                    AND teacher_id = ?
                `,
                [
                    school_id,
                    req.user.id
                ]
            );

        if (!membership) {

            return res.status(403).json({
                error:
                    "Du tillhör inte denna skola."
            });

        }

        await db.query(
            `
            UPDATE users
            SET active_school_id = ?
            WHERE id = ?
            `,
            [
                school_id,
                req.user.id
            ]
        );

        res.json({
            success: true
        });

    }
);


export default router;