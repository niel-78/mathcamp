import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// GET /api/sections/:id/blocks
router.get("/:id/blocks", async (req, res) => {

    const [blocks] = await db.query(
        `
        SELECT
            b.*,
            cu.first_name AS created_by_first_name,
            cu.last_name AS created_by_last_name,
            uu.first_name AS updated_by_first_name,
            uu.last_name AS updated_by_last_name
        FROM block_sections bs
        JOIN blocks b
            ON b.id = bs.block_id
        LEFT JOIN users cu
            ON cu.id = b.created_by
        LEFT JOIN users uu
            ON uu.id = b.updated_by
        WHERE bs.section_id = ?
        AND b.deleted_at IS NULL
        `,
        [req.params.id]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks);

});

// POST /api/sections/:sectionId/blocks/:blockId
router.post("/:sectionId/blocks/:blockId", requireAuth,
    async (req, res) => {

        const { sectionId, blockId } = req.params;

        const [exists] = await db.query(
            `
            SELECT 1
            FROM block_sections
            WHERE block_id = ?
            AND section_id = ?
            `,
            [
                blockId,
                sectionId
            ]
        );

        if (!exists.length) {

            await db.query(
                `
                INSERT INTO block_sections (
                    block_id,
                    section_id
                )
                VALUES (?, ?)
                `,
                [
                    blockId,
                    sectionId
                ]
            );

        }

        res.sendStatus(204);

    }
);

export default router;