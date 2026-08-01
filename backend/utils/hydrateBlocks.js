import db from "../db.js";

export default async function hydrateBlocks(blocks) {

    for (const block of blocks) {

        const [questions] = await db.query(
            `
            SELECT *
            FROM questions
            WHERE block_id = ?
            `,
            [block.id]
        );

        for (const question of questions) {

            const [options] = await db.query(
                `
                SELECT *
                FROM options
                WHERE question_id = ?
                `,
                [question.id]
            );

            question.options = options;

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

    }

    return blocks;

}