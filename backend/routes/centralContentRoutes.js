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
GET    /api/central-content
POST   /api/central-content

GET    /api/central-content/:id
PUT    /api/central-content/:id
DELETE /api/central-content/:id

GET    /api/central-content/:id/blocks
POST   /api/central-content/:id/blocks
*/



// GET    /api/central-content
// POST   /api/central-content

// GET    /api/central-content/:id
// PUT    /api/central-content/:id
// DELETE /api/central-content/:id

// GET    /api/central-content/:id/blocks
// POST   /api/central-content/:id/blocks









// Nedre bör flyttas




// POST /api/central-content/:id/blocks/:id
router.post("/:centralContentId/blocks/:blockId",
    requireAuth,
    async (req, res) => {

        const {
            centralContentId,
            blockId
        } = req.params;

        await db.query(
            `
            INSERT IGNORE INTO block_central_content
            (
                block_id,
                central_content_id
            )
            VALUES (?, ?)
            `,
            [
                blockId,
                centralContentId
            ]
        );

        res.sendStatus(204);

    }
);

export default router;