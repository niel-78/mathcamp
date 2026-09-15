import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student"));

router.get("/", async (req, res) => {
    try {
        const [[construction]] = await db.query(
            `
            SELECT name, construction_xml, updated_at
            FROM student_geogebra_constructions
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        res.json({
            construction: construction || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Kunde inte hämta elevens GeoGebra-konstruktion."
        });
    }
});

router.put("/", async (req, res) => {
    const {
        construction_xml: constructionXml,
        name = "Min GeoGebra-konstruktion"
    } = req.body;

    if (typeof constructionXml !== "string" || constructionXml.length === 0) {
        return res.status(400).json({
            error: "En GeoGebra-konstruktion måste anges."
        });
    }

    if (constructionXml.length > 16 * 1024 * 1024) {
        return res.status(413).json({
            error: "GeoGebra-konstruktionen är för stor."
        });
    }

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 255) {
        return res.status(400).json({
            error: "Ange ett namn på konstruktionen."
        });
    }

    try {
        await db.query(
            `
            INSERT INTO student_geogebra_constructions (
                user_id,
                name,
                construction_xml
            )
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                construction_xml = VALUES(construction_xml),
                updated_at = CURRENT_TIMESTAMP
            `,
            [req.user.id, name.trim(), constructionXml]
        );

        res.json({
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Kunde inte spara elevens GeoGebra-konstruktion."
        });
    }
});

router.delete("/", async (req, res) => {
    try {
        await db.query(
            `
            DELETE FROM student_geogebra_constructions
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        res.json({
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Kunde inte radera elevens GeoGebra-konstruktion."
        });
    }
});

export default router;
