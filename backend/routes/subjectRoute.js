import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/subjects",
    async (req, res) => {

        try {

            console.log("GET /subjects");

            console.log("req.db =", db);

            const [subjects] = await db.query(`
                SELECT
                    id,
                    code,
                    name
                FROM subjects
                ORDER BY name
            `);

            console.log("subjects:", subjects);

            res.json(subjects);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);


router.get("/subjects/full", 
    async (req, res) => {

        try {

            const [subjects] = await db.query(`
                SELECT
                    id,
                    code,
                    name
                FROM subjects
                ORDER BY name
            `);

            const [levels] = await db.query(`
                SELECT
                    id,
                    subject_id,
                    code,
                    name
                FROM levels
                ORDER BY name
            `);

            const [areas] = await db.query(`
                SELECT
                    id,
                    level_id,
                    title,
                    sort_order
                FROM content_areas
                ORDER BY sort_order
            `);

            const [content] = await db.query(`
                SELECT
                    id,
                    area_id,
                    content,
                    sort_order
                FROM central_content
                ORDER BY sort_order
            `);

            subjects.forEach(subject => {

                subject.levels = levels
                    .filter(
                        level =>
                            level.subject_id ===
                            subject.id
                    );

                subject.levels.forEach(level => {

                    level.areas = areas
                        .filter(
                            area =>
                                area.level_id ===
                                level.id
                        );

                    level.areas.forEach(area => {

                        area.centralContent =
                            content.filter(
                                item =>
                                    item.area_id ===
                                    area.id
                            );

                    });

                });

            });

            res.json(subjects);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);

router.get(
    "/central-content/:id/blocks",
    async (req, res) => {

        try {

            const [blocks] = await db.query(
                `
                SELECT DISTINCT
                    b.*
                FROM blocks b
                JOIN block_central_content bcc
                    ON b.id = bcc.block_id
                WHERE bcc.central_content_id = ?
                ORDER BY b.name
                `,
                [req.params.id]
            );

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
            }

            res.json(blocks);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);


export default router;