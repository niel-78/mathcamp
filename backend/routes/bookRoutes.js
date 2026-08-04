import express from "express";
import db from "../db.js";

const router = express.Router();

/*
GET    /api/books
POST   /api/books

GET    /api/books/:id
PUT    /api/books/:id
DELETE /api/books/:id

GET    /api/books/:id/sections
GET    /api/blocks/:id/book-sections/:sectionId

*/
// GET /api/books
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

// PUT /api/books/:id
router.put("/:id", async (req, res) => {

    try {

        const {
            title,
            description
        } = req.body;

        await db.query(
            `
            UPDATE books
            SET
                title = ?,
                description = ?
            WHERE id = ?
            `,
            [
                title,
                description,
                req.params.id
            ]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte uppdatera boken."
        });

    }

});

// GET /api/books/:id/sections
router.get("/:id/sections", async (req, res) => {
    try {

        const [sections] = await db.query(
            `
            SELECT
                s.id,
                s.subchapter_id,
                s.title,
                s.content,
                s.page_number,
                s.sort_order,

                sc.title AS subchapter_title,
                c.title AS chapter_title

            FROM sections s

            INNER JOIN subchapters sc
                ON sc.id = s.subchapter_id

            INNER JOIN chapters c
                ON c.id = sc.chapter_id

            WHERE c.book_id = ?

            ORDER BY
                c.sort_order,
                sc.sort_order,
                s.sort_order
            `,
            [req.params.id]
        );

        res.json(sections);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte hämta sektionerna."
        });

    }
});

// GET /api/books/sections/:sectionId
router.get("/sections/:sectionId", async (req, res) => {
    try {

        const [rows] = await db.query(
            `
            SELECT
                s.id,
                s.title,
                s.content,
                s.page_number,
                s.sort_order,

                sc.id AS subchapter_id,
                sc.subchapter_number,
                sc.title AS subchapter_title,

                c.id AS chapter_id,
                c.chapter_number,
                c.title AS chapter_title,

                b.id AS book_id,
                b.title AS book_title

            FROM sections s

            INNER JOIN subchapters sc
                ON sc.id = s.subchapter_id

            INNER JOIN chapters c
                ON c.id = sc.chapter_id

            INNER JOIN books b
                ON b.id = c.book_id

            WHERE s.id = ?
            `,
            [req.params.sectionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Sektionen hittades inte."
            });
        }

        res.json(rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte hämta sektionen."
        });

    }
});



export default router;