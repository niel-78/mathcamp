import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router =
    express.Router();

router.get("/",requireAuth,
    async (req, res) => {

        const [[school]] =
            await db.query(
                `
                SELECT school_id
                FROM school_teachers
                WHERE teacher_id = ?
                `,
                [req.user.id]
            );

        if (!school) {

            return res.json({});

        }

        const [[settings]] =
            await db.query(
                `
                SELECT *
                FROM school_settings
                WHERE school_id = ?
                `,
                [school.school_id]
            );

        res.json(settings || {});

    }
);



export default router;