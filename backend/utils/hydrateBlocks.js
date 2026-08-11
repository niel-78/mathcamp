import db from "../db.js";

export default async function hydrateBlocks(blocks) {

    for (const block of blocks) {

        const [questions] = await db.query(
            `
            SELECT
                q.*,
                ql.name AS level_name,
                ql.description AS level_description,
                ql.sort_order AS level_sort_order
            FROM questions q
            LEFT JOIN question_levels ql
                ON ql.id = q.level_id
            WHERE q.block_id = ?
            AND q.deleted_at IS NULL
            `,
            [block.id]
        );


        const [[owner]] = await db.query(
            `
            SELECT
                id,
                first_name,
                last_name
            FROM users
            WHERE id = ?
            `,
            [block.created_by]
        );

        block.owner = owner;


        for (const question of questions) {

            const [options] = await db.query(
                `
                SELECT *
                FROM options
                WHERE question_id = ?
                AND deleted_at IS NULL
                `,
                [question.id]
            );

            question.options = options;

            const [media] = await db.query(
                `
                SELECT *
                FROM question_media
                WHERE question_id = ?
                ORDER BY sort_order
                `,
                [question.id]
            );

            question.media = media;

        }

        block.questions = questions;

        const [centralContent] = await db.query(
            `
            SELECT cc.*
            FROM block_central_content bcc
            JOIN central_content cc
                ON cc.id = bcc.central_content_id
            WHERE bcc.block_id = ?
            `,
            [block.id]
        );

        block.centralContent = centralContent;

        const [bookSections] = await db.query(
            `
            SELECT s.*
            FROM block_sections bs
            JOIN sections s
                ON s.id = bs.section_id
            WHERE bs.block_id = ?
            `,
            [block.id]
        );

        block.bookSections = bookSections;

        const [books] = await db.query(
            `
            SELECT DISTINCT
                b.id,
                b.title

            FROM block_sections bs

            JOIN sections s
                ON s.id = bs.section_id

            JOIN subchapters sc
                ON sc.id = s.subchapter_id

            JOIN chapters c
                ON c.id = sc.chapter_id

            JOIN books b
                ON b.id = c.book_id

            WHERE bs.block_id = ?
            `,
            [block.id]
        );

        block.books = books;

        const [subjects] = await db.query(
            `
            SELECT DISTINCT
                s.id,
                s.name
            FROM block_central_content bcc

            JOIN central_content cc
                ON cc.id = bcc.central_content_id

            JOIN content_areas ca
                ON ca.id = cc.area_id

            JOIN levels l
                ON l.id = ca.level_id

            JOIN subjects s
                ON s.id = l.subject_id

            WHERE bcc.block_id = ?
            `,
            [block.id]
        );

        block.subjects = subjects;

        const [levels] = await db.query(
            `
            SELECT DISTINCT
                l.id,
                l.name
            FROM block_central_content bcc

            JOIN central_content cc
                ON cc.id = bcc.central_content_id

            JOIN content_areas ca
                ON ca.id = cc.area_id

            JOIN levels l
                ON l.id = ca.level_id

            WHERE bcc.block_id = ?
            `,
            [block.id]
        );

        block.levels = levels;

    }

    return blocks;

}