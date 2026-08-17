import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

// GET /api/classroom-layouts/:id
router.get("/:id", async (req, res) => {

    const [[layout]] = await db.query(
        `
        SELECT *
        FROM classroom_layouts
        WHERE id = ?
        `,
        [req.params.id]
    );

    if (!layout) {
        return res.status(404).json({
            error: "Layout not found"
        });
    }

    res.json(layout);

});

// PUT /api/classroom-layouts/:id
router.put("/:id", async (req, res) => {

    const {
        name
    } = req.body;

    await db.query(
        `
        UPDATE classroom_layouts
        SET name = ?
        WHERE id = ?
        `,
        [
            name,
            req.params.id
        ]
    );

    res.sendStatus(204);

});

// DELETE /api/classroom-layouts/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        DELETE FROM classroom_layouts
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.sendStatus(204);

});

// POST /api/classroom-layouts/:id/duplicate
router.post("/:id/duplicate",
    async (req, res) => {

        const { name } = req.body;

        const [[layout]] = await db.query(
            `
            SELECT *
            FROM classroom_layouts
            WHERE id = ?
            `,
            [req.params.id]
        );

        const [result] = await db.query(
            `
            INSERT INTO classroom_layouts (
                classroom_id,
                name
            )
            VALUES (?, ?)
            `,
            [
                layout.classroom_id,
                name
            ]
        );

        const newLayoutId =
            result.insertId;

        await db.query(
            `
            INSERT INTO classroom_seats (
                layout_id,
                seat_label,
                x_position,
                y_position
            )
            SELECT
                ?,
                seat_label,
                x_position,
                y_position
            FROM classroom_seats
            WHERE layout_id = ?
            `,
            [
                newLayoutId,
                req.params.id
            ]
        );

        res.status(201).json({
            id: newLayoutId
        });

    }
);

// GET /api/classroom-layouts/:id/seats
router.get("/:id/seats",
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT *
            FROM classroom_seats
            WHERE layout_id = ?
            ORDER BY seat_label
            `,
            [req.params.id]
        );

        res.json(rows);

    }
);

// POST /api/classroom-layouts/:id/seats
router.post("/:id/seats",
    async (req, res) => {

        const {
            seat_label,
            seat_row,
            seat_column,
            x_position,
            y_position
        } = req.body;

        const [result] = await db.query(
            `
            INSERT INTO classroom_seats (
                layout_id,
                seat_label,
                seat_row,
                seat_column,
                x_position,
                y_position
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                req.params.id,
                seat_label,
                seat_row,
                seat_column,
                x_position,
                y_position
            ]
        );

        res.status(201).json({
            id: result.insertId
        });

    }
);

export default router;