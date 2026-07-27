import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {

    const [books] = await db.query(
        `
        SELECT *
        FROM books
        ORDER BY title
        `
    );

    for (const book of books) {

        const [chapters] = await db.query(
            `
            SELECT *
            FROM chapters
            WHERE book_id = ?
            ORDER BY sort_order
            `,
            [book.id]
        );

        for (const chapter of chapters) {

            const [subchapters] = await db.query(
                `
                SELECT *
                FROM subchapters
                WHERE chapter_id = ?
                ORDER BY sort_order
                `,
                [chapter.id]
            );

            for (const subchapter of subchapters) {

                const [sections] = await db.query(
                    `
                    SELECT *
                    FROM sections
                    WHERE subchapter_id = ?
                    ORDER BY sort_order
                    `,
                    [subchapter.id]
                );

                for (let i = 0; i < sections.length; i++) {

                    sections[i].end_page =

                        i < sections.length - 1

                            ? sections[i + 1].page_number - 1

                            : sections[i].page_number;

                }

                subchapter.sections = sections;

            }

            chapter.subchapters = subchapters;

        }

        book.chapters = chapters;

    }

    res.json(books);

});

router.get(
    "/sections/:sectionId",
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                s.*,

                sc.title
                    AS subchapter_title,

                sc.subchapter_number,

                c.title
                    AS chapter_title,

                c.chapter_number

            FROM sections s

            JOIN subchapters sc
                ON sc.id =
                    s.subchapter_id

            JOIN chapters c
                ON c.id =
                    sc.chapter_id

            WHERE s.id = ?
            `,
            [req.params.sectionId]
        );

        if (!rows.length) {

            return res.sendStatus(404);

        }

        res.json(rows[0]);

    }
);

export default router;