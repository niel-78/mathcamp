import express from "express";

import db from "../db.js";

const router =
    express.Router();

router.get("/", async (req, res) => {

    try {

        const [rows] =
            await db.query(
                `
                SELECT settings
                FROM app_settings
                WHERE id = 1
                `
            );

        res.json(
            rows[0]?.settings || {}
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte hämta inställningar."
        });

    }

});

router.put("/", async (req, res) => {

    try {

        await db.query(
            `
            UPDATE app_settings
            SET settings = ?
            WHERE id = 1
            `,
            [
                JSON.stringify(
                    req.body
                )
            ]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Kunde inte spara inställningar."
        });

    }

});

export default router;