import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

/*
GET    /api/sections
POST   /api/sections

GET    /api/sections/:id
PUT    /api/sections/:id
DELETE /api/sections/:id

GET    /api/sections/:id/blocks
*/

// GET /api/sections
// POST /api/sections

// GET /api/sections/:id
router.get("/:sectionId",
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                s.*,

                sc.title
                    AS subchapter_title,

                sc.subchapter_number,

                c.title
                    AS chapter_title,

                c.chapter_number

            FROM sections s

            JOIN subchapters sc
                ON sc.id =
                    s.subchapter_id

            JOIN chapters c
                ON c.id =
                    sc.chapter_id

            WHERE s.id = ?
            `,
            [req.params.sectionId]
        );

        if (!rows.length) {

            return res.sendStatus(404);

        }

        res.json(rows[0]);

    }
);
// PUT /api/sections/:id
// DELETE /api/sections/:id



export default router;