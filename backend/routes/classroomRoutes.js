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
router.post("/",
    requireAuth,
    async (req, res) => {

        const {
            schoolId,
            name,
            sourceLayoutId
        } = req.body;

        if (req.user.role !== "super") {

            const [[membership]] =
                await db.query(
                    `
                    SELECT is_admin
                    FROM school_teachers
                    WHERE teacher_id = ?
                    AND school_id = ?
                    `,
                    [
                        req.user.id,
                        schoolId
                    ]
                );

            if (!membership?.is_admin) {

                return res.status(403).json({
                    error: "Behörighet saknas"
                });

            }
        }

        const [result] =
            await db.query(
                `
                INSERT INTO classrooms (
                    school_id,
                    name
                )
                VALUES (?, ?)
                `,
                [
                    schoolId,
                    name
                ]
            );

        const classroomId =
            result.insertId;

        if (sourceLayoutId) {

            const [[sourceLayout]] =
                await db.query(
                    `
                    SELECT *
                    FROM classroom_layouts
                    WHERE id = ?
                    `,
                    [sourceLayoutId]
                );

            if (sourceLayout) {

                await db.query(
                    `
                    INSERT INTO classroom_layouts (
                        classroom_id,
                        name,
                        is_default
                    )
                    VALUES (?, ?, 1)
                    `,
                    [
                        classroomId,
                        sourceLayout.name
                    ]
                );

            }

        } else {

            await db.query(
                `
                INSERT INTO classroom_layouts (
                    classroom_id,
                    name,
                    is_default
                )
                VALUES (?, 'Standardlayout', 1)
                `,
                [classroomId]
            );

        }

        res.json({
            id: classroomId
        });

    }
);

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
        name,
        source_layout_id
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

    const newLayoutId =
        result.insertId;

    if (source_layout_id) {

        const [seats] =
            await db.query(
                `
                SELECT
                    seat_number,
                    seat_label,
                    seat_row,
                    seat_column,
                    x_position,
                    y_position
                FROM classroom_seats
                WHERE layout_id = ?
                `,
                [source_layout_id]
            );

        for (const seat of seats) {

            await db.query(
                `
                INSERT INTO classroom_seats (
                    layout_id,
                    seat_label,
                    seat_number,
                    seat_row,
                    seat_column,
                    x_position,
                    y_position
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    newLayoutId,
                    seat.seat_label,
                    seat.seat_number,
                    seat.seat_row,
                    seat.seat_column,
                    seat.x_position,
                    seat.y_position
                ]
            );

        }

    }

    res.status(201).json({
        id: newLayoutId
    });

});


export default router;