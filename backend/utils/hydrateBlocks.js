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
            AND q.archived_at IS NULL
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

        const [levels] = await db.query(
            `
            SELECT DISTINCT
                asl.*
            FROM block_abilities ba

            JOIN abilities a
                ON a.id = ba.ability_id

            JOIN ability_series_levels asl
                ON asl.series_id = a.series_id

            WHERE ba.block_id = ?

            ORDER BY asl.sort_order
            `,
            [block.id]
        );

        block.levels = levels;

        const [points] = await db.query(
            `
            SELECT
                bp.*,

                cc.content AS central_content,

                cd.grade,

                c.id AS competency_id,
                c.name AS competency_name,

                l.id AS level_id,
                l.name AS level_name

            FROM block_points bp

            LEFT JOIN central_content cc
                ON cc.id = bp.central_content_id

            LEFT JOIN competency_descriptors cd
                ON cd.id = bp.competency_descriptor_id

            LEFT JOIN competencies c
                ON c.id = cd.competency_id

            LEFT JOIN levels l
                ON l.id = cd.level_id

            WHERE bp.block_id = ?
            `,
            [block.id]
        );

        block.points = points;

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

        const [abilities] = await db.query(
            `
            SELECT
                a.*,

                aps.name AS series_name,

                s.id AS subject_id,
                s.name AS subject_name

            FROM block_abilities ba

            JOIN abilities a
                ON a.id = ba.ability_id

            LEFT JOIN ability_series aps
                ON aps.id = a.series_id

            LEFT JOIN subjects s
                ON s.id = aps.subject_id

            WHERE ba.block_id = ?

            ORDER BY a.name
            `,
            [block.id]
        );

        block.abilities = abilities;

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

    }

    return blocks;

}