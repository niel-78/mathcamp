import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// PUT /api/block-points/id
router.put("/:id", requireAuth,
    async (req, res) => {

        const {
            central_content_id,
            grading_ability_level_id,
            points,
            comment
        } = req.body;

        if (
            !Number.isInteger(Number(points))
        ) {
            return res.status(400).json({
                error: "Poäng måste vara ett heltal."
            });
        }

        await db.query(
            `
            UPDATE block_points
            SET
                central_content_id = ?,
                grading_ability_level_id = ?,
                points = ?,
                comment = ?
            WHERE id = ?
            `,
            [
                central_content_id,
                grading_ability_level_id,
                points,
                comment,
                req.params.id
            ]
        );

        res.sendStatus(204);

    }
);


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