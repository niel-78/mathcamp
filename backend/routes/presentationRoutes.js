import multer from "multer";
import path from "path";
import express from "express";
import db from "../db.js";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

router.get("/", async (req, res) => {

        const [presentations] =
            await db.query(
                `
                SELECT
                    p.*,
                    s.title AS section_title
                FROM presentations p
                LEFT JOIN sections s
                    ON s.id = p.section_id
                WHERE p.archived_at IS NULL
                ORDER BY p.title
                `
            );

        res.json(
            presentations
        );

    }
);

router.get("/:id", async (req, res) => {
    try {
        const [presentations] = await db.query(
            `
            SELECT
                p.*,
                s.title AS section_title
            FROM presentations p
            LEFT JOIN sections s
                ON s.id = p.section_id
            WHERE p.id = ?
            AND p.archived_at IS NULL
            `,
            [req.params.id]
        );

        res.json(presentations[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database error"
        });
    }
});

router.post("/", async (req, res) => {

        const {
            title,
            content,
            section_id
        } = req.body;

        const [result] =
            await db.query(
                `
                INSERT INTO presentations (
                    title,
                    content,
                    section_id
                )
                VALUES (?, ?, ?)
                `,
                [
                    title,
                    content,
                    section_id || null
                ]
            );

        res.status(201).json({
            id: result.insertId
        });

    }
);

router.put("/:id", 
    async (req, res) => {

        const {
            title,
            content,
            section_id
        } = req.body;

        await db.query(
            `
            UPDATE presentations
            SET
                title = ?,
                content = ?,
                section_id = ?
            WHERE id = ?
            `,
            [
                title,
                content,
                section_id || null,
                req.params.id
            ]
        );

        res.sendStatus(204);

    }
);

router.delete("/:id", async (req, res) => {

        await db.query(
            `
            DELETE
            FROM presentations
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);

router.get("/:id/slides", requireAuth,
    async (req, res) => {

        const [[presentation]] =
            await db.query(
                `
                SELECT
                    content
                FROM presentations
                WHERE id = ?
                `,
                [req.params.id]
            );

        if (!presentation) {

            return res
                .status(404)
                .send(
                    "Presentationen hittades inte"
                );

        }

        const slides =
            presentation.content
                .split("\n---\n");

        res.json(
            slides
        );

    }
);

// POST /api/presentations/:id/reset
router.post("/:id/reset",
    requireAuth,
    async (req, res) => {

        try {

            await db.query("START TRANSACTION");

            const [[presentation]] =
                await db.query(
                    `
                    SELECT *
                    FROM presentations
                    WHERE id = ?
                    AND archived_at IS NULL
                    `,
                    [req.params.id]
                );

            if (!presentation) {

                await db.query("ROLLBACK");

                return res.status(404).json({
                    error:
                        "Presentationen hittades inte"
                });

            }

            await db.query(
                `
                UPDATE presentations
                SET
                    archived_at = NOW(),
                    updated_by = ?
                WHERE id = ?
                `,
                [
                    req.user.id,
                    presentation.id
                ]
            );

            const [[section]] =
                await db.query(
                    `
                    SELECT *
                    FROM sections
                    WHERE id = ?
                    `,
                    [presentation.section_id]
                );

            if (!section) {

                await db.query("ROLLBACK");

                return res.status(404).json({
                    error:
                        "Sektionen hittades inte"
                });

            }

            const [[sectionInfo]] =
                await db.query(
                    `
                    SELECT
                        s.title AS section_title,
                        s.page_number,

                        sc.title AS subchapter_title,

                        c.title AS chapter_title,

                        b.title AS book_title

                    FROM sections s

                    LEFT JOIN subchapters sc
                        ON sc.id = s.subchapter_id

                    LEFT JOIN chapters c
                        ON c.id = sc.chapter_id

                    LEFT JOIN books b
                        ON b.id = c.book_id

                    WHERE s.id = ?
                    `,
                    [presentation.section_id]
                );

            const [[nextSection]] =
                await db.query(
                    `
                    SELECT page_number
                    FROM sections
                    WHERE subchapter_id = ?
                    AND page_number > ?
                    ORDER BY page_number
                    LIMIT 1
                    `,
                    [
                        section.subchapter_id,
                        section.page_number
                    ]
                );

            const startPage =
                section.page_number;

            const endPage =
                nextSection
                    ? nextSection.page_number - 1
                    : section.page_number;

            const [blocks] =
                await db.query(
                    `
                    SELECT
                        b.*,

                        GROUP_CONCAT(
                            DISTINCT a.name
                            ORDER BY a.name
                            SEPARATOR ', '
                        ) AS ability_titles

                    FROM blocks b

                    INNER JOIN block_sections bs
                        ON bs.block_id = b.id

                    LEFT JOIN block_abilities ba
                        ON ba.block_id = b.id

                    LEFT JOIN abilities a
                        ON a.id = ba.ability_id

                    WHERE bs.section_id = ?

                    GROUP BY b.id

                    ORDER BY b.id
                    `,
                    [presentation.section_id]
                );

            const abilities = [
                ...new Set(
                    blocks.flatMap(
                        block =>
                            (block.ability_titles || "")
                                .split(", ")
                                .filter(Boolean)
                    )
                )
            ];

            const slides = [
                {
                    type: "title",
                    book: sectionInfo.book_title,
                    chapter: sectionInfo.chapter_title,
                    subchapter:
                        sectionInfo.subchapter_title,
                    section:
                        sectionInfo.section_title,
                    startPage,
                    endPage
                },
                {
                    type: "goals",
                    title: "Lektionsmål",
                    abilities
                }
            ];

            for (const block of blocks) {

                const [[question]] =
                    await db.query(
                        `
                        SELECT *
                        FROM questions
                        WHERE block_id = ?
                        ORDER BY id
                        LIMIT 1
                        `,
                        [block.id]
                    );

                if (!question) {
                    continue;
                }

                slides.push({
                    type: "question",
                    blockId: block.id,
                    title:
                        block.ability_titles ||
                        "Exempel",
                    question:
                        question.question
                });

            }

            const [[teacher]] =
                await db.query(
                    `
                    SELECT school_id
                    FROM school_teachers
                    WHERE teacher_id = ?
                    `,
                    [req.user.id]
                );

            if (!teacher) {

                await db.query("ROLLBACK");

                return res.status(404).json({
                    error:
                        "Lärare hittades inte"
                });

            }

            const presentationTitle =
                [
                    sectionInfo.chapter_title,
                    sectionInfo.subchapter_title
                ]
                    .filter(Boolean)
                    .join(" - ");

            const [result] =
                await db.query(
                    `
                    INSERT INTO presentations (
                        school_id,
                        section_id,
                        title,
                        content,
                        created_by,
                        updated_by
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        teacher.school_id,
                        section.id,
                        presentationTitle,
                        JSON.stringify({
                            slides
                        }),
                        req.user.id,
                        req.user.id
                    ]
                );

            const [[newPresentation]] =
                await db.query(
                    `
                    SELECT *
                    FROM presentations
                    WHERE id = ?
                    `,
                    [result.insertId]
                );

            await db.query("COMMIT");

            res.json({
                presentation:
                    newPresentation
            });

        } catch (error) {

            await db.query("ROLLBACK");

            console.error(error);

            res.status(500).json({
                error:
                    error.message
            });

        }

    }
);

export default router