import express from "express";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "../db.js";
import AssessmentEngine from "../services/AssessmentEngine.js";

const router = express.Router();
const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
);

function getAppVersion() {
    if (process.env.APP_VERSION) {
        return process.env.APP_VERSION;
    }

    try {
        return execFileSync(
            "git",
            ["rev-parse", "--short=8", "HEAD"],
            {
                cwd: repositoryDirectory,
                encoding: "utf8"
            }
        ).trim();
    } catch {
        return "development";
    }
}

const appVersion = getAppVersion();

router.get("/version", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ version: appVersion });
});

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

            const [[group]] =
                await db.query(
                    `
                    SELECT id, name, school_id, book_id
                    FROM \`groups\`
                    WHERE id = ?
                    `,
                    [groupId]
                );

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

            const lessonIds = lessons.map(lesson => lesson.id);
            const sectionsByLessonId = new Map();

            if (lessonIds.length > 0) {
                const sectionPlaceholders =
                    lessonIds.map(() => "?").join(",");

                const [lessonSections] = await db.query(
                    `
                    SELECT
                        ls.lesson_id,
                        s.*,
                        ls.id AS lesson_section_id,
                        ls.pinned

                    FROM lesson_sections ls

                    JOIN sections s
                        ON s.id = ls.section_id

                    WHERE ls.lesson_id IN (${sectionPlaceholders})

                    ORDER BY
                        ls.lesson_id,
                        ls.pinned DESC,
                        s.page_number
                    `,
                    lessonIds
                );

                const subchapterIds = [...new Set(lessonSections.map(s => s.subchapter_id).filter(Boolean))];
                const endPageBySectionId = new Map();

                if (subchapterIds.length > 0) {
                    const [allSubchapterSections] = await db.query(
                        `
                        SELECT id, subchapter_id, page_number, sort_order
                        FROM sections
                        WHERE subchapter_id IN (?)
                        ORDER BY subchapter_id, sort_order
                        `,
                        [subchapterIds]
                    );

                    const bySubchapter = new Map();
                    for (const s of allSubchapterSections) {
                        if (!bySubchapter.has(s.subchapter_id)) {
                            bySubchapter.set(s.subchapter_id, []);
                        }
                        bySubchapter.get(s.subchapter_id).push(s);
                    }

                    for (const subSections of bySubchapter.values()) {
                        for (let i = 0; i < subSections.length; i++) {
                            const current = subSections[i];
                            let endPage = current.page_number;
                            if (i < subSections.length - 1 && subSections[i + 1].page_number != null) {
                                endPage = subSections[i + 1].page_number - 1;
                            }
                            if (endPage != null && current.page_number != null && endPage < current.page_number) {
                                endPage = current.page_number;
                            }
                            endPageBySectionId.set(current.id, endPage);
                        }
                    }
                }

                for (const section of lessonSections) {
                    section.end_page = endPageBySectionId.get(section.id) ?? section.page_number;
                    const sections =
                        sectionsByLessonId.get(section.lesson_id) || [];

                    sections.push(section);
                    sectionsByLessonId.set(
                        section.lesson_id,
                        sections
                    );
                }
            }

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

                lesson.sections =
                    sectionsByLessonId.get(lesson.id) || [];

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
                group: group || { id: groupId, name: "" },
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

// GET /api/public/lessons/:id/group-assessments
router.get("/lessons/group-assessments",
    async (req, res) => {
        try {
            const lessonIds = (req.query.lessonIds || "")
                .split(",")
                .map(Number)
                .filter(Boolean);

            if (lessonIds.length === 0) {
                return res.json([]);
            }

            const placeholders = lessonIds.map(() => "?").join(",");
            const [rows] = await db.query(
                `
                SELECT
                    lga.lesson_id,
                    ga.id,
                    a.title,
                    a.type
                FROM lesson_group_assessments lga
                INNER JOIN group_assessments ga
                    ON ga.id = lga.group_assessment_id
                INNER JOIN assessments a
                    ON a.id = ga.assessment_id
                WHERE lga.lesson_id IN (${placeholders})
                    AND ga.mode = 'normal'
                    AND ga.deleted_at IS NULL
                `,
                lessonIds
            );

            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: "Kunde inte hämta lektionshändelser."
            });
        }
    }
);

router.get("/lessons/:id/group-assessments",
    async (req, res) => {
        try {
            const [rows] = await db.query(
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
                    AND ga.deleted_at IS NULL
                `,
                [req.params.id]
            );

            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: "Kunde inte hämta provtillfällen."
            });
        }
    }
);

// GET /api/public/lessons/:lessonId/group-assessments/:groupAssessmentId/diagnostic-details
router.get("/lessons/:lessonId/group-assessments/:groupAssessmentId/diagnostic-details",
    async (req, res) => {
        try {
            const lessonId = Number(req.params.lessonId);
            const groupAssessmentId = Number(req.params.groupAssessmentId);

            const [[ga]] = await db.query(
                `
                SELECT
                    ga.*,
                    a.type AS assessment_type,
                    a.title AS assessment_title,
                    l.group_id,
                    l.starts_at,
                    g.book_id
                FROM group_assessments ga
                INNER JOIN assessments a
                    ON a.id = ga.assessment_id
                LEFT JOIN lessons l
                    ON l.id = ?
                LEFT JOIN \`groups\` g
                    ON g.id = ga.group_id
                WHERE ga.id = ?
                AND ga.deleted_at IS NULL
                `,
                [lessonId, groupAssessmentId]
            );

            if (!ga) {
                return res.status(404).json({
                    error: "Provtillfället hittades inte."
                });
            }

            const config =
                typeof ga.config === "string"
                    ? JSON.parse(ga.config || "{}")
                    : ga.config || {};

            const selectedBlockIds =
                Array.isArray(config.selected_block_ids)
                    ? config.selected_block_ids.map(Number).filter(Boolean)
                    : [];

            let includedSections = [];

            if (selectedBlockIds.length > 0) {
                const [sectionRows] = await db.query(
                    `
                    SELECT DISTINCT
                        s.id,
                        s.subchapter_id,
                        s.title,
                        s.page_number,
                        s.sort_order
                    FROM block_sections bs
                    INNER JOIN sections s
                        ON s.id = bs.section_id
                    WHERE bs.block_id IN (?)
                    AND s.page_number IS NOT NULL
                    ORDER BY
                        s.page_number ASC,
                        s.sort_order ASC
                    `,
                    [selectedBlockIds]
                );
                includedSections = sectionRows;
            } else {
                const plan = await AssessmentEngine.getDiagnosticSeedPlan(
                    lessonId,
                    null,
                    null
                );
                const candidateSections = plan.sections?.filter(s => !s.previouslyIncluded) || [];
                const targetSections = candidateSections.length > 0 ? candidateSections : (plan.sections || []);
                const targetSectionIds = targetSections.map(s => s.id).filter(Boolean);

                if (targetSectionIds.length > 0) {
                    const [sectionRows] = await db.query(
                        `
                        SELECT id, subchapter_id, title, page_number, sort_order
                        FROM sections
                        WHERE id IN (?)
                        AND page_number IS NOT NULL
                        ORDER BY page_number ASC, sort_order ASC
                        `,
                        [targetSectionIds]
                    );
                    includedSections = sectionRows;
                }
            }

            const allSubchapterIds = [...new Set(includedSections.map(s => s.subchapter_id).filter(Boolean))];
            const endPageBySectionId = new Map();

            if (allSubchapterIds.length > 0) {
                const [allSubSections] = await db.query(
                    `
                    SELECT id, subchapter_id, page_number, sort_order
                    FROM sections
                    WHERE subchapter_id IN (?)
                    ORDER BY subchapter_id, sort_order
                    `,
                    [allSubchapterIds]
                );

                const bySubchapter = new Map();
                for (const s of allSubSections) {
                    if (!bySubchapter.has(s.subchapter_id)) {
                        bySubchapter.set(s.subchapter_id, []);
                    }
                    bySubchapter.get(s.subchapter_id).push(s);
                }

                for (const subSections of bySubchapter.values()) {
                    for (let i = 0; i < subSections.length; i++) {
                        const current = subSections[i];
                        let endPage = current.page_number;
                        if (i < subSections.length - 1 && subSections[i + 1].page_number != null) {
                            endPage = subSections[i + 1].page_number - 1;
                        }
                        if (endPage != null && current.page_number != null && endPage < current.page_number) {
                            endPage = current.page_number;
                        }
                        endPageBySectionId.set(current.id, endPage);
                    }
                }
            }

            const formattedIncludedSections = includedSections.map(s => {
                const endPage = endPageBySectionId.get(s.id) ?? s.page_number;
                return {
                    id: s.id,
                    title: s.title,
                    page_number: s.page_number,
                    end_page: endPage,
                    page_range: s.page_number === endPage ? `${s.page_number}` : `${s.page_number}-${endPage}`
                };
            });

            res.json({
                group_assessment_id: groupAssessmentId,
                title: ga.assessment_title || "Diagnos",
                type: ga.assessment_type,
                sections: formattedIncludedSections,
                complement_sections: [],
                needs_complement: false,
                hideCompletions: true
            });

        } catch (err) {
            console.error("public diagnostic-details error:", err);
            res.status(500).json({
                error: err.message
            });
        }
    }
);

export default router;