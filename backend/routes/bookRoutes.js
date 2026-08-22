import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});

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

// POST /api/books
router.post("/",
    requireAuth,
    requireRole("super"),
    async (req, res) => {

        try {

            const {
                title,
                description,
                levelId
            } = req.body;

            if (
                !title?.trim() ||
                !levelId
            ) {

                return res.status(400).json({
                    error:
                        "Titel och kurs krävs"
                });

            }

            const [bookResult] =
                await db.query(
                    `
                    INSERT INTO books (
                        title,
                        description
                    )
                    VALUES (?, ?)
                    `,
                    [
                        title.trim(),
                        description?.trim() || ""
                    ]
                );

            await db.query(
                `
                INSERT INTO level_books (
                    level_id,
                    book_id
                )
                VALUES (?, ?)
                `,
                [
                    levelId,
                    bookResult.insertId
                ]
            );

            res.json({
                id: bookResult.insertId,
                message:
                    "Boken skapades"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);

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

// POST /api/books/:id/import-sections
router.post("/:id/import-sections",
    requireAuth,
    requireRole("super"),
    upload.single("file"),
    async (req, res) => {

        try {

            const bookId =
                req.params.id;

            const replaceExisting =
                req.body.replaceExisting === "true";

            if (!req.file) {

                return res.status(400).json({
                    error: "Ingen fil uppladdad"
                });

            }

            if (replaceExisting) {

                await db.query(`
                    DELETE s
                    FROM sections s
                    INNER JOIN subchapters sc
                        ON sc.id = s.subchapter_id
                    INNER JOIN chapters c
                        ON c.id = sc.chapter_id
                    WHERE c.book_id = ?
                `, [bookId]);

                await db.query(`
                    DELETE sc
                    FROM subchapters sc
                    INNER JOIN chapters c
                        ON c.id = sc.chapter_id
                    WHERE c.book_id = ?
                `, [bookId]);

                await db.query(`
                    DELETE FROM chapters
                    WHERE book_id = ?
                `, [bookId]);

            }

            const workbook = XLSX.read(
                req.file.buffer
            );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(sheet);

            let imported = 0;
            let skipped = 0;

            for (const row of rows) {

                const chapterNumber =
                    String(
                        row.KapitelNr ?? ""
                    ).trim();

                const chapterTitle =
                    row.KapitelTitel?.trim();

                const subchapterNumber =
                    String(
                        row.DelkapitelNr ?? ""
                    ).trim();

                const subchapterTitle =
                    row.DelkapitelTitel?.trim();

                const sectionTitle =
                    row.SektionTitel?.trim();

                const pageNumber =
                    Number(row.Sida);

                const includedByDefault =
                    [
                        "ja",
                        "true",
                        "1",
                        "yes"
                    ].includes(
                        String(
                            row.Ingår ??
                            row.ingår ??
                            "Ja"
                        )
                        .trim()
                        .toLowerCase()
                    );

                if (
                    !chapterNumber ||
                    !chapterTitle ||
                    !subchapterNumber ||
                    !subchapterTitle ||
                    !sectionTitle ||
                    Number.isNaN(pageNumber)
                ) {

                    skipped++;
                    continue;

                }

                let chapterId;

                const [[existingChapter]] =
                    await db.query(
                        `
                        SELECT id
                        FROM chapters
                        WHERE book_id = ?
                        AND chapter_number = ?
                        `,
                        [
                            bookId,
                            chapterNumber
                        ]
                    );

                if (existingChapter) {

                    chapterId =
                        existingChapter.id;

                } else {

                    const [chapterResult] =
                        await db.query(
                            `
                            INSERT INTO chapters (
                                book_id,
                                chapter_number,
                                title,
                                sort_order
                            )
                            VALUES (?, ?, ?, ?)
                            `,
                            [
                                bookId,
                                chapterNumber,
                                chapterTitle,
                                chapterNumber
                            ]
                        );

                    chapterId =
                        chapterResult.insertId;

                }

                let subchapterId;

                const [[existingSubchapter]] =
                    await db.query(
                        `
                        SELECT id
                        FROM subchapters
                        WHERE chapter_id = ?
                        AND subchapter_number = ?
                        `,
                        [
                            chapterId,
                            subchapterNumber
                        ]
                    );

                if (existingSubchapter) {

                    subchapterId =
                        existingSubchapter.id;

                } else {

                    const [subchapterResult] =
                        await db.query(
                            `
                            INSERT INTO subchapters (
                                chapter_id,
                                subchapter_number,
                                title,
                                sort_order
                            )
                            VALUES (?, ?, ?, ?)
                            `,
                            [
                                chapterId,
                                subchapterNumber,
                                subchapterTitle,
                                subchapterNumber
                            ]
                        );

                    subchapterId =
                        subchapterResult.insertId;

                }

                const [[existingSection]] =
                    await db.query(
                        `
                        SELECT id
                        FROM sections
                        WHERE subchapter_id = ?
                        AND title = ?
                        `,
                        [
                            subchapterId,
                            sectionTitle
                        ]
                    );

                if (existingSection) {

                    skipped++;
                    continue;

                }

                await db.query(
                    `
                    INSERT INTO sections (
                        subchapter_id,
                        title,
                        page_number,
                        sort_order,
                        included_by_default
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        subchapterId,
                        sectionTitle,
                        pageNumber,
                        pageNumber,
                        includedByDefault
                    ]
                );

                imported++;

            }

            res.json({
                importedCount: imported,
                skippedCount: skipped
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);

router.get("/import-sections-template",
    requireAuth,
    requireRole("super"),
    async (req, res) => {

        const workbook =
            XLSX.utils.book_new();

        const worksheet =
            XLSX.utils.json_to_sheet([
                {
                    KapitelNr: "1",
                    KapitelTitel: "Tal",
                    DelkapitelNr: "1.1",
                    DelkapitelTitel: "Heltal",
                    SektionTitel: "Positiva tal",
                    Sida: 10,
                    Ingår: "Ja"
                },
                {
                    KapitelNr: "1",
                    KapitelTitel: "Tal",
                    DelkapitelNr: "1.1",
                    DelkapitelTitel: "Heltal",
                    SektionTitel: "Negativa tal",
                    Sida: 12,
                    Ingår: "Ja"
                },
                {
                    KapitelNr: "1",
                    KapitelTitel: "Tal",
                    DelkapitelNr: "1.2",
                    DelkapitelTitel: "Bråk",
                    SektionTitel: "Bråktal",
                    Sida: 15,
                    Ingår: "Nej"
                }
            ]);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Sektioner"
        );

        const buffer =
            XLSX.write(
                workbook,
                {
                    type: "buffer",
                    bookType: "xlsx"
                }
            );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="bokstruktur-mall.xlsx"'
        );

        res.send(buffer);
    }
);



export default router;