import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

// GET /api/classroom-seats/:id
router.get("/:id",
    async (req, res) => {

        const [[seat]] = await db.query(
            `
            SELECT *
            FROM classroom_seats
            WHERE id = ?
            `,
            [req.params.id]
        );

        if (!seat) {

            return res.status(404).json({
                error: "Seat not found"
            });

        }

        res.json(seat);

    }
);

// PUT /api/classroom-seats/:id
router.put("/:id",
    async (req, res) => {

        const {
            x_position,
            y_position
        } = req.body;

        await db.query(
            `
            UPDATE classroom_seats
            SET
                x_position = ?,
                y_position = ?
            WHERE id = ?
            `,
            [
                x_position,
                y_position,
                req.params.id
            ]
        );

        res.json({
            success: true
        });

    }
);

//DELETE /api/classroom-seats/:id
router.delete("/:id",
    async (req, res) => {

        await db.query(
            `
            DELETE FROM classroom_seats
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

export default router;