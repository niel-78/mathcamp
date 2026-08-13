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

router.post("/", requireAuth,
    async (req, res) => {

        const {
            group_id,
            weekday,
            start_time,
            end_time,
            valid_from,
            valid_to
        } = req.body;

        const [result] = await db.query(
            `
            INSERT INTO group_schedules (
                group_id,
                weekday,
                start_time,
                end_time,
                valid_from,
                valid_to
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                group_id,
                weekday,
                start_time,
                end_time,
                valid_from,
                valid_to
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


export default router
