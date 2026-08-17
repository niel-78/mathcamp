import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {

    const [classrooms] = await db.query(
        `
        SELECT c.*
        FROM classrooms c
        INNER JOIN school_teachers st
            ON st.school_id = c.school_id
        WHERE st.teacher_id = ?
        ORDER BY c.name
        `,
        [req.user.id]
    );

    for (const classroom of classrooms) {

        const [layouts] = await db.query(
            `
            SELECT *
            FROM classroom_layouts
            WHERE classroom_id = ?
            ORDER BY name
            `,
            [classroom.id]
        );

        classroom.layouts = layouts;

    }

    res.json(classrooms);

});

// POST /api/classrooms
router.post("/", async (req, res) => {

    const {
        name,
        description
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO classrooms (
            school_id,
            name,
            description
        )
        VALUES (?, ?, ?)
        `,
        [
            req.user.school_id,
            name,
            description
        ]
    );

    res.status(201).json({
        id: result.insertId
    });

});

// GET /api/classrooms/:id
router.get("/:id", async (req, res) => {

    const [[row]] = await db.query(
        `
        SELECT *
        FROM classrooms
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.json(row);

});

// PUT /api/classrooms/:id
router.put("/:id", async (req, res) => {

    const {
        name,
        description
    } = req.body;

    await db.query(
        `
        UPDATE classrooms
        SET
            name = ?,
            description = ?
        WHERE id = ?
        `,
        [
            name,
            description,
            req.params.id
        ]
    );

    res.sendStatus(204);

});

// DELETE /api/classrooms/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        DELETE FROM classrooms
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.sendStatus(204);

});

// GET /api/classrooms/:id/layouts
router.get("/:id/layouts",
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT *
            FROM classroom_layouts
            WHERE classroom_id = ?
            ORDER BY name
            `,
            [req.params.id]
        );

        res.json(rows);

    }
);

// POST /api/classrooms/:id/layouts
router.post("/:id/layouts", async (req, res) => {

    const {
        name
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO classroom_layouts (
            classroom_id,
            name
        )
        VALUES (?, ?)
        `,
        [
            req.params.id,
            name
        ]
    );

    res.status(201).json({
        id: result.insertId
    });

});

export default router;