import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import dayjs from "dayjs";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher"));

// GET /api/group-schedules
router.get("/",
    async (req, res) => {

    const [rows] =
        await db.query(
            `
            SELECT
                gs.*,
                c.name AS classroom_name,
                cl.name AS classroom_layout_name
            FROM group_schedules gs
            LEFT JOIN classrooms c
                ON c.id = gs.classroom_id
            LEFT JOIN classroom_layouts cl
                ON cl.id = gs.classroom_layout_id
            WHERE gs.group_id = ?
            `,
            [
                req.query.groupId
            ]
        );
        
        res.json(rows);

    }
);

// POST /api/group-schedules
router.post("/",
    async (req, res) => {

        const {
            group_id,
            weekday,
            start_time,
            end_time,
            valid_from,
            valid_to,
            classroom_id,
            classroom_layout_id
        } = req.body;

        const [result] = await db.query(
            `
            INSERT INTO group_schedules (
                group_id,
                weekday,
                start_time,
                end_time,
                valid_from,
                valid_to,
                classroom_id,
                classroom_layout_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                group_id,
                weekday,
                start_time,
                end_time,
                valid_from,
                valid_to,
                classroom_id,
                classroom_layout_id
            ]
        );

        const scheduleId =
            result.insertId;


        const [exceptions] = await db.query(
            `
            SELECT *
            FROM school_schedule_exceptions
            WHERE schoool_id = ?
            `,
            [school_id]
        );

        const exceptionMap = new Map();

        for (const exception of exceptions) {
            exceptionMap.set(
                dayjs(exception.date).format("YYYY-MM-DD"),
                exception
            );
        }

        let current =
            dayjs(valid_from);

        const endDate =
            dayjs(valid_to);

        while (
            current.isBefore(endDate) ||
            current.isSame(endDate, "day")
        ) {

            const exception =
                exceptionMap.get(
                    current.format("YYYY-MM-DD")
                );

            if (
                exception &&
                [
                    "holiday",
                    "study_day",
                    "cancelled"
                ].includes(exception.type)
            ) {
                current = current.add(1, "day");
                continue;
            }

            const mysqlWeekday =
                current.day() === 0
                    ? 7
                    : current.day();

            if (
                mysqlWeekday === weekday
            ) {


                const startsAt =
                    dayjs(
                        `${current.format("YYYY-MM-DD")} ${start_time}`
                    );

                const endsAt =
                    dayjs(
                        `${current.format("YYYY-MM-DD")} ${end_time}`
                    );

                await db.query(
                    `
                        INSERT INTO lessons (
                            group_id,
                            group_schedule_id,
                            classroom_id,
                            classroom_layout_id,
                            starts_at,
                            ends_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `,
                        [
                            group_id,
                            scheduleId,
                            classroom_id,
                            classroom_layout_id,
                            startsAt.format(
                                "YYYY-MM-DD HH:mm:ss"
                            ),
                            endsAt.format(
                                "YYYY-MM-DD HH:mm:ss"
                            )
                        ]
                );

            }

            current =
                current.add(1, "day");

        }

        res.status(201).json({
            id: scheduleId
        });

    }
);

// PUT /api/group-schedules/:id
router.put("/:id",
    async (req, res) => {

        const {
            start_time,
            end_time,
            scope,
            effective_from,
            classroom_id,
            classroom_layout_id
        } = req.body;

        if (scope === "all") {

            await db.query(
                `
                UPDATE lessons
                SET
                    classroom_id = ?,
                    classroom_layout_id = ?,

                    starts_at = CONCAT(
                        DATE(starts_at),
                        ' ',
                        ?
                    ),

                    ends_at = CONCAT(
                        DATE(ends_at),
                        ' ',
                        ?
                    )

                WHERE group_schedule_id = ?
                `,
                [
                    classroom_id || null,
                    classroom_layout_id || null,

                    start_time,
                    end_time,

                    req.params.id
                ]
            );

            await db.query(
                `
                UPDATE lessons
                SET
                    starts_at = CONCAT(
                        DATE(starts_at),
                        ' ',
                        ?
                    ),
                    ends_at = CONCAT(
                        DATE(ends_at),
                        ' ',
                        ?
                    )
                WHERE group_schedule_id = ?
                `,
                [
                    start_time,
                    end_time,
                    req.params.id
                ]
            );

        }

        if (scope === "future") {

            await db.query(
                `
                UPDATE lessons
                SET
                    classroom_id = ?,
                    classroom_layout_id = ?,

                    starts_at = CONCAT(
                        DATE(starts_at),
                        ' ',
                        ?
                    ),

                    ends_at = CONCAT(
                        DATE(ends_at),
                        ' ',
                        ?
                    )

                WHERE group_schedule_id = ?
                AND DATE(starts_at) >= ?
                `,
                [
                    classroom_id || null,
                    classroom_layout_id || null,

                    start_time,
                    end_time,

                    req.params.id,
                    effective_from
                ]
            );

        }

        res.sendStatus(204);

    }
);

// GET /api/group-schedules/exceptions?schoolId=1
router.get("/school/:schoolId/exceptions",
    async (req, res) => {
        try {

            const [rows] = await db.query(
                `
                SELECT *
                FROM school_schedule_exceptions
                WHERE school_id = ?
                ORDER BY date
                `,
                [req.params.schoolId]
            );

            res.json(rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Internt serverfel"
            });
        }
    }
);
router.post("/exceptions", async (req, res) => {

    const {
        school_id,
        date,
        type,
        note,
        affects_lessons = true
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO school_schedule_exceptions
        (
            school_id,
            date,
            type,
            note,
            affects_lessons
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            school_id,
            date,
            type,
            note,
            affects_lessons
        ]
    );

    res.status(201).json({
        id: result.insertId
    });

});

router.put("/exceptions/:id",
    async (req, res) => {

        const {
            date,
            type,
            note,
            affects_lessons
        } = req.body;

        await db.query(
            `
            UPDATE school_schedule_exceptions
            SET
                date = ?,
                type = ?,
                note = ?,
                affects_lessons = ?
            WHERE id = ?
            `,
            [
                date,
                type,
                note,
                affects_lessons,
                req.params.id
            ]
        );

        res.sendStatus(204);
    }
);

router.delete("/exceptions/:id",
    async (req, res) => {

        await db.query(
            `
            DELETE
            FROM school_schedule_exceptions
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);
    }
);

export default router
