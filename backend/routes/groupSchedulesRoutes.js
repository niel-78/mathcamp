import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import dayjs from "dayjs";


const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

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
            AND gs.deleted_at IS NULL
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
            school_id,
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
            SELECT DISTINCT
                sse.*
            FROM school_schedule_exceptions sse

            LEFT JOIN
                schedule_exception_groups seg
                ON seg.schedule_exception_id = sse.id

            WHERE sse.school_id = ?

            AND (
                seg.group_id IS NULL
                OR seg.group_id = ?
            )
            `,
            [
                school_id,
                group_id
            ]
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
                exception.affects_lessons
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

// DELETE /api/group-schedules/:id
router.delete("/:id",
    async (req, res) => {

        await db.query(
            `
            UPDATE group_schedules
            SET deleted_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        await db.query(
            `
            UPDATE lessons
            SET deleted_at = NOW()
            WHERE group_schedule_id = ?
            AND starts_at >= NOW()

            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// GET /api/group-schedules/exceptions?schoolId=1
router.get("/school/:schoolId/exceptions",
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT *
                    FROM school_schedule_exceptions
                    WHERE school_id = ?
                    ORDER BY date
                    `,
                    [req.params.schoolId]
                );

            for (const exception of rows) {

                const [groups] =
                    await db.query(
                        `
                        SELECT
                            g.id,
                            g.name
                        FROM schedule_exception_groups seg

                        JOIN \`groups\` g
                            ON g.id = seg.group_id

                        WHERE
                            seg.schedule_exception_id = ?
                        `,
                        [exception.id]
                    );

                exception.groups = groups;

            }

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
        title,
        type,
        note,
        affects_lessons = true,
        scope = "school",
        groupIds = []
    } = req.body;

    const [result] =
        await db.query(
            `
            INSERT INTO school_schedule_exceptions
            (
                school_id,
                date,
                title,
                type,
                note,
                affects_lessons
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                school_id,
                date,
                title,
                type,
                note,
                affects_lessons
            ]
        );

    if (
        scope === "groups" &&
        groupIds.length > 0
    ) {

        for (const groupId of groupIds) {

            await db.query(
                `
                INSERT INTO
                    schedule_exception_groups
                (
                    schedule_exception_id,
                    group_id
                )
                VALUES (?, ?)
                `,
                [
                    result.insertId,
                    groupId
                ]
            );

        }

    }

    res.status(201).json({
        id: result.insertId
    });

});

router.put("/exceptions/:id",
    async (req, res) => {

        const {
            date,
            title,
            type,
            note,
            affects_lessons,
            scope = "school",
            groupIds = []
        } = req.body;

        await db.query(
            `
            UPDATE school_schedule_exceptions
            SET
                date = ?,
                title = ?,
                type = ?,
                note = ?,
                affects_lessons = ?
            WHERE id = ?
            `,
            [
                date,
                title,
                type,
                note,
                affects_lessons,
                req.params.id
            ]
        );

        await db.query(
            `
            DELETE FROM schedule_exception_groups
            WHERE schedule_exception_id = ?
            `,
            [req.params.id]
        );

        if (
            scope === "groups" &&
            groupIds.length > 0
        ) {

            for (const groupId of groupIds) {

                await db.query(
                    `
                    INSERT INTO
                        schedule_exception_groups
                    (
                        schedule_exception_id,
                        group_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        req.params.id,
                        groupId
                    ]
                );

            }

        }

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

router.post("/exceptions/import",
    upload.single("file"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Ingen fil uppladdad"
                });
            }

            const schoolId =
                req.body.schoolId;

            const workbook =
                XLSX.read(
                    req.file.buffer
                );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {
                        raw: false
                    }
                );

            let imported = 0;

            for (const row of rows) {

                const date =
                    row.Datum ||
                    row.datum ||
                    row.Date;

                const title =
                    row.Rubrik ||
                    row.rubrik ||
                    row.Title ||
                    null;

                const type =
                    row.Typ ||
                    row.typ ||
                    row.Type ||
                    "other";

                const note =
                    row.Anteckning ||
                    row.anteckning ||
                    row.Note ||
                    null;

                const affectsLessons =
                    [
                        "ja",
                        "true",
                        "1",
                        "yes"
                    ].includes(
                        String(
                            row["Påverkar undervisning"] ??
                            row.affects_lessons ??
                            "Ja"
                        )
                        .trim()
                        .toLowerCase()
                    );

                if (!date) {
                    continue;
                }

                await db.query(
                    `
                    INSERT INTO
                    school_schedule_exceptions
                    (
                        school_id,
                        date,
                        title,
                        type,
                        note,
                        affects_lessons
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        type = VALUES(type),
                        note = VALUES(note),
                        affects_lessons =
                            VALUES(affects_lessons)
                    `,
                    [
                        schoolId,
                        date,
                        title,
                        type,
                        note,
                        affectsLessons
                    ]
                );

                imported++;

            }

            res.json({
                success: true,
                imported
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Import failed"
            });

        }

    }
);

// GET /api/group-schedules/groups/:groupId/events
router.get("/groups/:groupId/events",
    async (req, res) => {

        try {

            const [[group]] =
                await db.query(
                    `
                    SELECT school_id
                    FROM \`groups\`
                    WHERE id = ?
                    `,
                    [req.params.groupId]
                );

            if (!group) {
                return res.status(404).json({
                    error: "Gruppen hittades inte"
                });
            }

            const [events] =
                await db.query(
                    `
                    SELECT DISTINCT
                        sse.*

                    FROM school_schedule_exceptions sse

                    LEFT JOIN
                        schedule_exception_groups seg
                        ON seg.schedule_exception_id = sse.id

                    WHERE

                        (
                            seg.group_id = ?
                        )

                        OR

                        (
                            seg.group_id IS NULL
                            AND sse.school_id = ?
                        )

                    ORDER BY sse.date
                    `,
                    [
                        req.params.groupId,
                        group.school_id
                    ]
                );

            res.json(events);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);
export default router
