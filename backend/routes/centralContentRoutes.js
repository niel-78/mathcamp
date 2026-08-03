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


// GET /api/central-content/:id/blocks
router.get("/:centralContentId/blocks", async (req, res) => {

    const [blocks] = await db.query(
        `
        SELECT
            b.*,
            cu.first_name AS created_by_first_name,
            cu.last_name AS created_by_last_name,
            uu.first_name AS updated_by_first_name,
            uu.last_name AS updated_by_last_name
        FROM blocks b
        JOIN block_central_content bcc
            ON b.id = bcc.block_id
        LEFT JOIN users cu
            ON cu.id = b.created_by
        LEFT JOIN users uu
            ON uu.id = b.updated_by
        WHERE bcc.central_content_id = ?
        `,
        [req.params.centralContentId]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks);

});

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