import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import AssessmentEngine from "../services/AssessmentEngine.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher", "super"));

// GET /api/lessons?groupIds=1,2,3
router.get("/",
    requireAuth,
    async (req, res) => {

        try {

            const groupIds =
                req.query.groupIds
                    ?.split(",")
                    .map(Number)
                    .filter(Boolean);

            if (!groupIds?.length) {
                return res.json([]);
            }

            const placeholders =
                groupIds.map(() => "?").join(",");

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

                    WHERE l.group_id IN (${placeholders})
                    AND l.deleted_at IS NULL

                    ORDER BY l.starts_at
                    `,
                    groupIds
                );

            for (const lesson of lessons) {

                lesson.cancelled_by_exception =
                    !!lesson.schedule_exception_id &&
                    lesson.affects_lessons === 1;

                if (
                    lesson.cancelled_by_exception
                ) {

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
                            ls.pinned,
                            p.id AS presentation_id

                        FROM lesson_sections ls

                        JOIN sections s
                            ON s.id = ls.section_id

                        LEFT JOIN presentations p
                            ON p.section_id = s.id

                        WHERE ls.lesson_id = ?

                        ORDER BY
                            ls.pinned DESC,
                            s.page_number
                        `,
                        [lesson.id]
                    );

                lesson.sections =
                    sections;

            }

            res.json(lessons);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error:
                    "Kunde inte hämta lektioner."
            });

        }

    }
);

// PUT /api/lessons/:id
router.put("/:id", requireAuth,
    async (req, res) => {

        const {
            date,
            start_time,
            end_time,
            description
        } = req.body;

        await db.query(
            `
            UPDATE lessons
            SET
                starts_at = ?,
                ends_at = ?,
                description = ?
            WHERE id = ?
            `,
            [
                `${date} ${start_time}:00`,
                `${date} ${end_time}:00`,
                description,
                req.params.id
            ]
        );

        res.sendStatus(204);

    }
);

// POST /api/lessons/lessons-sections
router.post("/lesson-sections", requireAuth,
    async (req, res) => {

        const {
            lesson_id,
            section_id
        } = req.body;


        const [existing] = await db.query(
            `
            SELECT id
            FROM lesson_sections
            WHERE lesson_id = ?
            AND section_id = ?
            `,
            [
                lesson_id,
                section_id
            ]
        );

        if (existing.length) {

            return res
                .status(409)
                .send(
                    "Sektionen finns redan i lektionen."
                );

        }

        await db.query(
            `
            INSERT INTO lesson_sections
            (
                lesson_id,
                section_id
            )
            VALUES (?, ?)
            `,
            [
                lesson_id,
                section_id
            ]
        );

        res.sendStatus(201);


    }
);

// POST /api/lessons/move-section
router.post("/move-section", requireAuth,
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            await connection.beginTransaction();

            const {
                section_id,
                source_lesson_id,
                target_lesson_id,
                shift_forward
            } = req.body;

            if (
                source_lesson_id ===
                target_lesson_id
            ) {

                await connection.commit();

                return res.sendStatus(204);

            }

            const [existing] =
                await connection.query(
                    `
                    SELECT id
                    FROM lesson_sections
                    WHERE lesson_id = ?
                    AND section_id = ?
                    `,
                    [
                        target_lesson_id,
                        section_id
                    ]
                );

            if (existing.length) {

                await connection.rollback();

                return res
                    .status(409)
                    .send(
                        "Sektionen finns redan i lektionen."
                    );

            }

            /*
            Vanlig flytt
            */
            if (!shift_forward) {

                await connection.query(
                    `
                    UPDATE lesson_sections
                    SET lesson_id = ?
                    WHERE lesson_id = ?
                    AND section_id = ?
                    `,
                    [
                        target_lesson_id,
                        source_lesson_id,
                        section_id
                    ]
                );

                await connection.commit();

                return res.sendStatus(204);

            }

            /*
            Skjut fram planeringen
            */
            const [[targetLesson]] =
                await connection.query(
                    `
                    SELECT
                        id,
                        group_id,
                        starts_at
                    FROM lessons
                    WHERE id = ?
                    `,
                    [target_lesson_id]
                );

            const [futureLessons] =
                await connection.query(
                    `
                    SELECT
                        l.id,

                        (
                            SELECT COUNT(*)
                            FROM lesson_sections ls
                            WHERE ls.lesson_id = l.id
                        ) AS section_count

                    FROM lessons l

                    WHERE l.group_id = ?
                    AND l.deleted_at IS NULL
                    AND l.starts_at >= ?

                    ORDER BY l.starts_at
                    `,
                    [
                        targetLesson.group_id,
                        targetLesson.starts_at
                    ]
                );

            const emptyLessonIndex =
                futureLessons.findIndex(
                    lesson =>
                        lesson.section_count === 0
                );

            if (emptyLessonIndex === -1) {

                await connection.rollback();

                return res
                    .status(400)
                    .send(
                        "Ingen tom lektion hittades."
                    );

            }

            /*
            Flytta sista sektionen framåt
            lektion för lektion
            */
            for (
                let i = emptyLessonIndex;
                i > 0;
                i--
            ) {

                const currentLessonId =
                    futureLessons[i].id;

                const previousLessonId =
                    futureLessons[i - 1].id;

                const [lastSectionRows] =
                    await connection.query(
                        `
                        SELECT
                            id
                        FROM lesson_sections
                        WHERE lesson_id = ?
                        ORDER BY sort_order DESC
                        LIMIT 1
                        `,
                        [previousLessonId]
                    );

                if (!lastSectionRows.length) {
                    continue;
                }

                const lastSection =
                    lastSectionRows[0];

                await connection.query(
                    `
                    UPDATE lesson_sections
                    SET sort_order =
                        sort_order + 1
                    WHERE lesson_id = ?
                    `,
                    [currentLessonId]
                );

                await connection.query(
                    `
                    UPDATE lesson_sections
                    SET
                        lesson_id = ?,
                        sort_order = 1
                    WHERE id = ?
                    `,
                    [
                        currentLessonId,
                        lastSection.id
                    ]
                );

            }

            const [[maxSort]] =
                await connection.query(
                    `
                    SELECT
                        COALESCE(
                            MAX(sort_order),
                            0
                        ) AS max_sort
                    FROM lesson_sections
                    WHERE lesson_id = ?
                    `,
                    [target_lesson_id]
                );

            await connection.query(
                `
                UPDATE lesson_sections
                SET
                    lesson_id = ?,
                    sort_order = ?
                WHERE lesson_id = ?
                AND section_id = ?
                `,
                [
                    target_lesson_id,
                    maxSort.max_sort + 1,
                    source_lesson_id,
                    section_id
                ]
            );

            await connection.commit();

            return res.sendStatus(204);

        } catch (error) {

            await connection.rollback();

            console.error(error);

            return res
                .status(500)
                .send(
                    "Ett fel uppstod."
                );

        } finally {

            connection.release();

        }

    }
);

// POST /api/lessons/:id/cancel
router.put("/:id/cancel",requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE lessons
            SET cancelled_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// DELETE /api/lessons/:id
router.delete("/:id", requireAuth,
    async (req, res) => {

        await db.query(
            `
            DELETE FROM lessons
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// POST /api/lessons/:id/restore
router.put("/:id/restore",requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE lessons
            SET cancelled_at = NULL
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

// PUT /api/lessons-section:id/pin
router.put("/lesson-sections/:id/pin", requireAuth,
    async (req, res) => {

        const { pinned } =
            req.body;

        const [rows] =
            await db.query(
                `
                SELECT
                    *
                FROM lesson_sections
                WHERE id = ?
                `,
                [req.params.id]
            );

        console.log(rows);

        await db.query(
            `
            UPDATE lesson_sections
            SET pinned = ?
            WHERE id = ?
            `,
            [
                pinned ? 1 : 0,
                req.params.id
            ]
        );

        res.sendStatus(204);

    }
);

// GET /api/lessons/teacher
router.get("/teacher",
    requireAuth,
    async (req, res) => {

        try {

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

                    JOIN group_permissions gp
                        ON gp.group_id = g.id

                    LEFT JOIN classrooms c
                        ON c.id = l.classroom_id

                    LEFT JOIN classroom_layouts cl
                        ON cl.id = l.classroom_layout_id

                    LEFT JOIN school_schedule_exceptions sse
                        ON sse.school_id = g.school_id
                        AND sse.date = DATE(l.starts_at)

                    WHERE gp.user_id = ?
                    AND l.deleted_at IS NULL

                    ORDER BY l.starts_at
                    `,
                    [req.user.id]
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

            }


            const lessonIds =
                lessons.map(
                    lesson => lesson.id
                );

            if (lessonIds.length) {

                const placeholders =
                    lessonIds
                        .map(() => "?")
                        .join(",");

                const [sections] =
                    await db.query(
                        `
                        SELECT
                            s.*,
                            ls.id AS lesson_section_id,
                            ls.lesson_id,
                            ls.pinned

                        FROM lesson_sections ls

                        JOIN sections s
                            ON s.id = ls.section_id

                        WHERE ls.lesson_id
                            IN (${placeholders})

                        ORDER BY
                            ls.pinned DESC,
                            s.page_number
                        `,
                        lessonIds
                    );

                const sectionsByLesson =
                    {};

                for (const section of sections) {

                    if (
                        !sectionsByLesson[
                            section.lesson_id
                        ]
                    ) {

                        sectionsByLesson[
                            section.lesson_id
                        ] = [];

                    }

                    sectionsByLesson[
                        section.lesson_id
                    ].push(section);

                }

                for (const lesson of lessons) {

                    lesson.sections =
                        sectionsByLesson[
                            lesson.id
                        ] ?? [];

                }

            }



            res.json(
                lessons
            );

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error:
                    "Kunde inte hämta lärarkalendern."
            });

        }

    }
);

// POST /api/lessons/:id/group-assessments
router.post("/:id/group-assessments",
    async (req, res) => {

        const {
            type,
            mode = "normal"
        } = req.body;

        const connection =
            await db.getConnection();

        try {

            await connection.beginTransaction();

            const lessonId =
                req.params.id;

            let assessmentId =
                req.body.assessment_id;

            const [[lesson]] =
                await connection.query(
                    `
                    SELECT
                        group_id
                    FROM lessons
                    WHERE id = ?
                    `,
                    [lessonId]
                );

            if (!lesson) {

                await connection.rollback();

                return res.status(404).json({
                    error: "Lektionen hittades inte."
                });

            }

            if (type === "diagnostic") {

                const [[assessment]] =
                    await connection.query(
                        `
                        SELECT id
                        FROM assessments
                        WHERE type = 'diagnostic'
                        AND subject_id = 1
                        AND archived_at IS NULL
                        AND deleted_at IS NULL
                        LIMIT 1
                        `
                    );

                if (!assessment) {

                    throw new Error(
                        "Ingen diagnostisk assessment hittades."
                    );

                }

                assessmentId =
                    assessment.id;

            }

            const [existing] =
                await connection.query(
                    `
                    SELECT
                        group_assessment_id
                    FROM lesson_group_assessments
                    WHERE lesson_id = ?
                    LIMIT 1
                    `,
                    [lessonId]
                );

            if (
                existing.length > 0 &&
                mode !== "test"
            ) {

                await connection.rollback();

                return res.status(409).json({
                    error:
                        "Lektionen har redan ett provtillfälle."
                });

            }

            const [result] =
                await connection.query(
                    `
                    INSERT INTO group_assessments (

                        assessment_id,
                        group_id,
                        status,
                        mode

                    )
                    VALUES (

                        ?,
                        ?,
                        'waiting',
                        ?

                    )
                    `,
                    [
                        assessmentId,
                        lesson.group_id,
                        mode
                    ]
                );

            const groupAssessmentId =
                result.insertId;

            await connection.query(
                `
                INSERT INTO lesson_group_assessments (
                    lesson_id,
                    group_assessment_id
                )
                VALUES (?, ?)
                `,
                [
                    lessonId,
                    groupAssessmentId
                ]
            );

            await connection.commit();

            res.status(201).json({
                lesson_id: lessonId,
                group_assessment_id:
                    groupAssessmentId
            });


        } catch (error) {

            await connection.rollback();

            console.error(error);

            res.status(500).json({
                error:
                    error.message ||
                    "Kunde inte skapa provtillfälle."
            });

        } finally {

            connection.release();

        }

    }
);

// GET /api/lessons/:id/group-assessments
router.get("/:id/group-assessments",
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    ga.*,
                    a.title,
                    a.type
                FROM lesson_group_assessments lga

                INNER JOIN group_assessments ga
                    ON ga.id = lga.group_assessment_id

                INNER JOIN assessments a
                    ON a.id = ga.assessment_id

                WHERE lga.lesson_id = ?
                    AND ga.mode = 'normal'
                `,
                [req.params.id]
            );

        res.json(rows);

    }
);

// GET /api/lessons/:lessonId/diagnostic-preview
router.get("/:lessonId/diagnostic-preview",
    async (req, res) => {

        const plan =
            await AssessmentEngine
                .getDiagnosticSeedPlan(
                    req.params.lessonId
                );

        res.json(plan);

    }
);

export default router
