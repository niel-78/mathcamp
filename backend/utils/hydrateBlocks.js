import db from "../db.js";

export default async function hydrateBlocks(blocks, groupId = null) {

    for (const block of blocks) {

        const [questions] = await db.query(
            `
            SELECT
                q.*,
                ql.name AS level_name,
                ql.description AS level_description,
                ql.sort_order AS level_sort_order,
                COALESCE(
                    report_counts.report_count,
                    0
                ) AS report_count,
                gqp.question_id IS NOT NULL AS is_priority
            FROM questions q
            LEFT JOIN question_levels ql
                ON ql.id = q.level_id
            LEFT JOIN (
                SELECT
                    question_id,
                    COUNT(*) AS report_count
                FROM question_reports
                WHERE report_type = 'missing_correct_option'
                GROUP BY question_id
            ) report_counts
                ON report_counts.question_id = q.id
            LEFT JOIN group_question_priorities gqp
                ON gqp.question_id = q.id
                AND gqp.group_id = ?
            WHERE q.block_id = ?
            AND q.deleted_at IS NULL
            AND q.archived_at IS NULL
            `,
            [groupId ? Number(groupId) : null, block.id]
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

        const questionIds =
            questions.map(question => question.id);

        const optionsByQuestionId = new Map();
        const mediaByQuestionId = new Map();

        if (questionIds.length > 0) {
            const [options] = await db.query(
                `
                SELECT *
                FROM options
                WHERE question_id IN (?)
                AND deleted_at IS NULL
                `,
                [questionIds]
            );

            for (const option of options) {
                const questionOptions =
                    optionsByQuestionId.get(option.question_id) || [];

                questionOptions.push(option);
                optionsByQuestionId.set(
                    option.question_id,
                    questionOptions
                );
            }

            const [mediaItems] = await db.query(
                `
                SELECT *
                FROM question_media
                WHERE question_id IN (?)
                ORDER BY question_id, sort_order
                `,
                [questionIds]
            );

            for (const mediaItem of mediaItems) {
                const questionMedia =
                    mediaByQuestionId.get(mediaItem.question_id) || [];

                questionMedia.push(mediaItem);
                mediaByQuestionId.set(
                    mediaItem.question_id,
                    questionMedia
                );
            }
        }

        for (const question of questions) {

            question.options =
                optionsByQuestionId.get(question.id) || [];

            question.media =
                mediaByQuestionId.get(question.id) || [];

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
            SELECT
                s.*,
                b.id AS book_id,
                b.title AS book_title,
                l.id AS course_level_id,
                l.name AS course_level_name,
                l.code AS course_level_code
            FROM block_sections bs
            JOIN sections s
                ON s.id = bs.section_id
            JOIN subchapters sc
                ON sc.id = s.subchapter_id
            JOIN chapters c
                ON c.id = sc.chapter_id
            JOIN books b
                ON b.id = c.book_id
            LEFT JOIN level_books lb
                ON lb.book_id = b.id
            LEFT JOIN levels l
                ON l.id = lb.level_id
            WHERE bs.block_id = ?
            ORDER BY b.title, s.title
            `,
            [block.id]
        );

        block.bookSections = bookSections;

        const booksMap = new Map();
        const coursesMap = new Map();

        for (const sec of bookSections) {
            if (sec.book_id && !booksMap.has(sec.book_id)) {
                booksMap.set(sec.book_id, {
                    id: sec.book_id,
                    title: sec.book_title
                });
            }
            if (sec.course_level_id && !coursesMap.has(sec.course_level_id)) {
                coursesMap.set(sec.course_level_id, {
                    id: sec.course_level_id,
                    name: sec.course_level_name,
                    code: sec.course_level_code
                });
            }
        }

        for (const pt of points) {
            if (pt.level_id && !coursesMap.has(pt.level_id)) {
                coursesMap.set(pt.level_id, {
                    id: pt.level_id,
                    name: pt.level_name
                });
            }
        }

        block.books = Array.from(booksMap.values());
        block.courses = Array.from(coursesMap.values());

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

        const seriesIds =
            [...new Set(
                abilities
                    .map(a => a.series_id)
                    .filter(Boolean)
            )];

        let seriesLevels = [];

        if (seriesIds.length) {

            [seriesLevels] = await db.query(
                `
                SELECT *
                FROM ability_series_levels
                WHERE series_id IN (?)
                ORDER BY sort_order
                `,
                [seriesIds]
            );

        }

        block.seriesLevels = seriesLevels;

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