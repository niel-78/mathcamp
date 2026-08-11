import express from "express";
import db from "../db.js";

const router = express.Router();


// DELETE /api/block-points/:id
router.delete("/:id",
    async (req, res) => {

        await db.query(
            `
            DELETE
            FROM block_points
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);


export default router;