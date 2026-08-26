import express from "express";
import db from "../db.js";

const router = express.Router();

// GET /api/public/planning/:shareId
router.get("/planning/:shareId",
    async (req, res) => {

        try {

            const [[link]] =
                await db.query(
                    `
                    SELECT *
                    FROM planning_share_links
                    WHERE id = ?
                    AND revoked_at IS NULL
                    `,
                    [req.params.shareId]
                );

            if (!link) {

                return res.status(404).json({
                    error: "Länken finns inte"
                });

            }

            const groupId =
                link.group_id;

            const [lessons] =
                await db.query(
                    `
                    SELECT
                        l.*,

                        g.name AS group_name,
                        g.school_id,

                        c.name AS classroom_name,

                        cl.name AS classroom_layout_name,

                        sse.id AS schedule_exception_id,
                        sse.title AS schedule_exception_title,
                        sse.type AS schedule_exception_type,
                        sse.note AS schedule_exception_note,
                        sse.affects_lessons

                    FROM lessons l

                    JOIN \`groups\` g
                        ON g.id = l.group_id

                    LEFT JOIN classrooms c
                        ON c.id = l.classroom_id

                    LEFT JOIN classroom_layouts cl
                        ON cl.id = l.classroom_layout_id

                    LEFT JOIN school_schedule_exceptions sse
                        ON sse.school_id = g.school_id
                        AND sse.date = DATE(l.starts_at)

                    WHERE l.group_id = ?

                    ORDER BY l.starts_at
                    `,
                    [groupId]
                );

            for (const lesson of lessons) {

                lesson.cancelled_by_exception =
                    !!lesson.schedule_exception_id &&
                    lesson.affects_lessons === 1;

                if (lesson.cancelled_by_exception) {

                    lesson.cancelled_reason =
                        lesson.schedule_exception_title ||
                        lesson.schedule_exception_note ||
                        "Inställd undervisning";

                }

                const [sections] =
                    await db.query(
                        `
                        SELECT
                            s.*,
                            ls.id AS lesson_section_id,
                            ls.pinned

                        FROM lesson_sections ls

                        JOIN sections s
                            ON s.id = ls.section_id

                        WHERE ls.lesson_id = ?
                        `,
                        [lesson.id]
                    );

                lesson.sections =
                    sections;

            }

            const [events] =
                await db.query(
                    `
                    SELECT DISTINCT
                        sse.*

                    FROM school_schedule_exceptions sse

                    LEFT JOIN schedule_exception_groups seg
                        ON seg.schedule_exception_id = sse.id

                    JOIN \`groups\` g
                        ON g.id = ?

                    WHERE
                        seg.group_id = ?
                        OR (
                            seg.group_id IS NULL
                            AND sse.school_id = g.school_id
                        )

                    ORDER BY sse.date
                    `,
                    [
                        groupId,
                        groupId
                    ]
                );

            res.json({
                lessons,
                events

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte hämta planeringen"
            });

        }

    }
);

export default router;