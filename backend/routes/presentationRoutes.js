import multer from "multer";
import path from "path";
import express from "express";
import db from "../db.js";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

router.get("/", async (req, res) => {

        const [presentations] =
            await db.query(
                `
                SELECT
                    p.*,
                    s.title AS section_title
                FROM presentations p
                LEFT JOIN sections s
                    ON s.id = p.section_id
                ORDER BY p.title
                `
            );

        res.json(
            presentations
        );

    }
);

router.get("/:id", async (req, res) => {
    try {
        const [presentations] = await db.query(
            `
            SELECT
                p.*,
                s.title AS section_title
            FROM presentations p
            LEFT JOIN sections s
                ON s.id = p.section_id
            WHERE p.id = ?
            `,
            [req.params.id]
        );

        res.json(presentations[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database error"
        });
    }
});

router.post("/", async (req, res) => {

        const {
            title,
            content,
            section_id
        } = req.body;

        const [result] =
            await db.query(
                `
                INSERT INTO presentations (
                    title,
                    content,
                    section_id
                )
                VALUES (?, ?, ?)
                `,
                [
                    title,
                    content,
                    section_id || null
                ]
            );

        res.status(201).json({
            id: result.insertId
        });

    }
);

router.put("/:id", async (req, res) => {

        const {
            title,
            content,
            section_id
        } = req.body;

        await db.query(
            `
            UPDATE presentations
            SET
                title = ?,
                content = ?,
                section_id = ?
            WHERE id = ?
            `,
            [
                title,
                content,
                section_id || null,
                req.params.id
            ]
        );

        res.sendStatus(204);

    }
);

router.delete("/:id", async (req, res) => {

        await db.query(
            `
            DELETE
            FROM presentations
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

router.get("/:id/slides", requireAuth,
    async (req, res) => {

        const [[presentation]] =
            await db.query(
                `
                SELECT
                    content
                FROM presentations
                WHERE id = ?
                `,
                [req.params.id]
            );

        if (!presentation) {

            return res
                .status(404)
                .send(
                    "Presentationen hittades inte"
                );

        }

        const slides =
            presentation.content
                .split("\n---\n");

        res.json(
            slides
        );

    }
);

export default router