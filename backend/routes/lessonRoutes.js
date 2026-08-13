import express from "express";
import db from "../db.js";
import crypto from "crypto";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { buildExamSession } from "../utils/buildExamSession.js";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher"));

// GET /api/lessons?groupIds=1,2,3
router.get("/", requireAuth,
    async (req, res) => {

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
                    g.name AS group_name
                FROM lessons l
                JOIN groups g
                    ON g.id = l.group_id
                WHERE l.group_id IN (${placeholders})
                ORDER BY l.starts_at
                `,
                groupIds
            );

        for (const lesson of lessons) {

            const [sections] =
                await db.query(
                    `
                    SELECT
                        s.*
                    FROM lesson_sections ls
                    JOIN sections s
                        ON s.id = ls.section_id
                    WHERE ls.lesson_id = ?
                    ORDER BY s.page_number
                    `,
                    [lesson.id]
                );

            lesson.sections = sections;

        }

        res.json(lessons);

    }
);

// POST /api/lessons/lessons-sections
router.post("/lesson-sections",
    requireAuth,
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

        const {
            section_id,
            source_lesson_id,
            target_lesson_id
        } = req.body;

        if (
            source_lesson_id ===
            target_lesson_id
        ) {

            return res.sendStatus(204);

        }

        const [existing] =
            await db.query(
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

            return res
                .status(409)
                .send(
                    "Sektionen finns redan i lektionen."
                );

        }

        await db.query(
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

        res.sendStatus(204);

    }
);

export default router
