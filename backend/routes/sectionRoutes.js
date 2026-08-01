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
        SELECT b.*
        FROM block_sections bs
        JOIN blocks b
            ON b.id = bs.block_id
        WHERE bs.section_id = ?
        AND b.deleted_at IS NULL
        `,
        [req.params.id]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks);

});

export default router;