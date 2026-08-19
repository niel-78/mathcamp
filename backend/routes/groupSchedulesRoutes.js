import express from "express";
import db from "../db.js";
import crypto from "crypto";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { buildExamSession } from "../utils/buildExamSession.js";
import dayjs from "dayjs";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher"));

// GET /api/group-schedules
router.get("/",requireAuth,
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
router.post("/", requireAuth,
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

        let current =
            dayjs(valid_from);

        const endDate =
            dayjs(valid_to);

        while (
            current.isBefore(endDate) ||
            current.isSame(endDate, "day")
        ) {

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
                        starts_at,
                        ends_at
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        group_id,
                        scheduleId,
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
router.put("/:id", requireAuth,
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
                UPDATE group_schedules
                SET
                    start_time = ?,
                    end_time = ?,
                    classroom_id = ?,
                    classroom_layout_id = ?
                WHERE id = ?
                `,
                [
                    start_time,
                    end_time,
                    classroom_id || null,
                    classroom_layout_id || null,
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


export default router
