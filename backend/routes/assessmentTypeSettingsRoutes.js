import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("super"));

router.get("/:type", async (req, res) => {

    const [[row]] =
        await db.query(
            `
            SELECT config
            FROM assessment_type_settings
            WHERE assessment_type = ?
            `,
            [req.params.type]
        );

    const config =
        typeof row?.config === "string"
            ? JSON.parse(row.config || "{}")
            : row?.config || {};

    res.json({
        assessment_type: req.params.type,
        config
    });

});

router.put("/:type", async (req, res) => {

    await db.query(
        `
        INSERT INTO assessment_type_settings (
            assessment_type,
            config
        )
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
            config = VALUES(config)
        `,
        [
            req.params.type,
            JSON.stringify(req.body?.config || {})
        ]
    );

    res.json({
        success: true
    });

});

export default router;