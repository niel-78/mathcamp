import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

import { getAppSettings } from "../utils/getAppSettings.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

router.use(requireAuth);
router.use(requireRole("teacher","super"));

// GET /api/blocks/sections/:sectionId
router.get("/sections/:sectionId",
    async (req, res) => {

        const [[teacher]] =
            await db.query(
                `
                SELECT school_id
                FROM school_teachers
                WHERE teacher_id = ?
                `,
                [req.user.id]
            );

        const schoolId =
            teacher?.school_id;

        const [blocks] =
            await db.query(
                `
                SELECT
                    b.*
                FROM blocks b

                INNER JOIN block_sections bs
                    ON bs.block_id = b.id

                WHERE
                    bs.section_id = ?
                    AND b.deleted_at IS NULL

                    AND (

                        b.created_by = ?

                        OR (

                            b.visibility = 'school'
                            AND b.school_id = ?

                        )

                        OR (

                            b.visibility = 'global'

                        )

                    )

                ORDER BY b.id
                `,
                [
                    req.params.sectionId,
                    req.user.id,
                    schoolId
                ]
            );

        const hydratedBlocks =
            await hydrateBlocks(blocks);

        for (const block of hydratedBlocks) {

            const isOwner =
                block.created_by ===
                req.user.id;

            block.canEdit =
                isOwner;

            block.category =
                isOwner
                    ? "mine"
                    : block.visibility === "global"
                    ? "global"
                    : "school";

        }

        res.json(
            hydratedBlocks
        );

    }
);

// GET /api/blocks/central-content/:centralContentId
router.get("/central-content/:centralContentId",
    async (req, res) => {

        const [[teacher]] =
            await db.query(
                `
                SELECT school_id
                FROM school_teachers
                WHERE teacher_id = ?
                `,
                [req.user.id]
            );

        const schoolId =
            teacher?.school_id;

        const [blocks] =
            await db.query(
                `
                SELECT DISTINCT
                    b.*,

                    cu.first_name
                        AS created_by_first_name,

                    cu.last_name
                        AS created_by_last_name,

                    uu.first_name
                        AS updated_by_first_name,

                    uu.last_name
                        AS updated_by_last_name

                FROM blocks b

                JOIN block_points bp
                    ON bp.block_id = b.id

                LEFT JOIN users cu
                    ON cu.id = b.created_by

                LEFT JOIN users uu
                    ON uu.id = b.updated_by

                WHERE

                    bp.central_content_id = ?

                    AND b.deleted_at IS NULL

                    AND (

                        b.created_by = ?

                        OR (
                            b.visibility = 'school'
                            AND b.school_id = ?
                        )

                        OR (
                            b.visibility = 'global'
                        )

                    )
                `,
                [
                    req.params.centralContentId,
                    req.user.id,
                    schoolId
                ]
            );

        const hydratedBlocks =
            await hydrateBlocks(
                blocks
            );

        for (
            const block of hydratedBlocks
        ) {

            const isOwner =
                block.created_by ===
                req.user.id;

            block.canEdit =
                isOwner;

            block.category =
                isOwner
                    ? "mine"
                    : block.visibility === "global"
                    ? "global"
                    : "school";

        }

        res.json(
            hydratedBlocks
        );

    }
);


// GET /api/abilities/:abilityId
router.get("/abilities/:abilityId", async (req, res) => {
    const [[teacher]] = await db.query(
        `
        SELECT school_id
        FROM school_teachers
        WHERE teacher_id = ?
        `,
        [req.user.id]
    );

    const schoolId = teacher?.school_id;

    const [blocks] = await db.query(
        `
        SELECT
            b.*
        FROM blocks b

        INNER JOIN block_abilities ba
            ON ba.block_id = b.id

        WHERE
            ba.ability_id = ?
            AND b.deleted_at IS NULL

            AND (
                b.created_by = ?
                OR (
                    b.visibility = 'school'
                    AND b.school_id = ?
                )
                OR (
                    b.visibility = 'global'
                )
            )

        ORDER BY b.id
        `,
        [
            req.params.abilityId,
            req.user.id,
            schoolId
        ]
    );

    const hydratedBlocks = await hydrateBlocks(blocks);

    for (const block of hydratedBlocks) {
        const isOwner =
            block.created_by === req.user.id;

        block.canEdit = isOwner;

        block.category = isOwner
            ? "mine"
            : block.visibility === "global"
            ? "global"
            : "school";
    }

    res.json(hydratedBlocks);
});

// GET /api/blocks/:id
router.get("/:blockId/", async (req, res) => {

    const [blocks] = await db.query(
        `
        SELECT
            b.*,
            cu.first_name AS created_by_first_name,
            cu.last_name AS created_by_last_name,
            uu.first_name AS updated_by_first_name,
            uu.last_name AS updated_by_last_name
        FROM blocks b
        LEFT JOIN users cu
            ON cu.id = b.created_by
        LEFT JOIN users uu
            ON uu.id = b.updated_by
        WHERE b.id = ?
        `,
        [req.params.blockId]
    );

    const hydratedBlocks =
        await hydrateBlocks(blocks);

    res.json(hydratedBlocks[0]);

});

// POST /api/blocks/4/archive
router.post("/:id/archive", requireAuth,
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT id
                FROM blocks
                WHERE id = ?
                AND created_by = ?
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );

        if (!rows.length) {
            return res.sendStatus(403);
        }

        await db.query(
            `
            UPDATE blocks
            SET archived_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);


// GET /api/blocks/
router.get("/", async (req, res) => {

    const [[teacher]] =
        await db.query(
            `
            SELECT school_id
            FROM school_teachers
            WHERE teacher_id = ?
            `,
            [req.user.id]
        );

    const schoolId =
        teacher?.school_id;

    const [[schoolSettings]] =
        await db.query(
            `
            SELECT
                enable_block_copying
            FROM school_settings
            WHERE school_id = ?
            `,
            [schoolId]
        );

        let blocks;

        if (req.user.role === "super") {

            [blocks] = await db.query(
                `
                SELECT
                    b.*,

                    cu.first_name
                        AS created_by_first_name,

                    cu.last_name
                        AS created_by_last_name,

                    uu.first_name
                        AS updated_by_first_name,

                    uu.last_name
                        AS updated_by_last_name

                FROM blocks b

                LEFT JOIN users cu
                    ON cu.id = b.created_by

                LEFT JOIN users uu
                    ON uu.id = b.updated_by

                WHERE b.deleted_at IS NULL
                AND b.archived_at IS NULL
                `
            );

        } else {

            [blocks] = await db.query(
                `
                SELECT
                    b.*,

                    cu.first_name
                        AS created_by_first_name,

                    cu.last_name
                        AS created_by_last_name,

                    uu.first_name
                        AS updated_by_first_name,

                    uu.last_name
                        AS updated_by_last_name

                FROM blocks b

                LEFT JOIN users cu
                    ON cu.id = b.created_by

                LEFT JOIN users uu
                    ON uu.id = b.updated_by

                WHERE

                    b.deleted_at IS NULL
                    AND b.archived_at IS NULL

                    AND (

                        b.created_by = ?

                        OR (

                            b.visibility = 'school'
                            AND b.school_id = ?

                        )

                        OR (

                            b.visibility = 'global'

                        )

                    )
                `,
                [
                    req.user.id,
                    schoolId
                ]
            );

        }

    const hydratedBlocks =
        await hydrateBlocks(
            blocks
        );

    for (const block of hydratedBlocks) {

        const isOwner =
            block.created_by === req.user.id;

        block.isOwner = isOwner;

        block.canEdit =
            req.user.role === "super" ||
            isOwner;

        block.canCopy =
            !isOwner &&
            schoolSettings?.enable_block_copying;

        if (isOwner) {

            block.category = "mine";

        } else if (
            block.visibility === "global"
        ) {

            block.category = "global";

        } else {

            block.category = "school";

        }

    }  

    res.json(
        hydratedBlocks
    );

});

// POST /api/blocks
router.post("/", async (req, res) => {

    try {

        const {
            question,
            points = [],
            sectionIds = [],
            examId,
            visibility = "school"
        } = req.body;

        if (
            visibility === "global" &&
            req.user.role !== "super"
        ) {

            return res.status(403).json({
                error:
                    "Endast superanvändare får skapa globala block."
            });

        }

        const [[school]] =
            await db.query(
                `
                SELECT school_id
                FROM school_teachers
                WHERE teacher_id = ?
                `,
                [req.user.id]
            );

        const [blockResult] = await db.query(
            `
                INSERT INTO blocks (
                    created_by,
                    updated_by,
                    school_id,
                    visibility
                )
                VALUES (?, ?, ?, ?)
            `,
            [
                req.user.id,
                req.user.id,
                school?.school_id || null,
                visibility
            ]
        );

        const blockId = blockResult.insertId;

        if (examId) {

            const [rows] = await db.query(
                `
                SELECT
                    COALESCE(MAX(sort_order), 0) + 1
                    AS nextOrder
                FROM exam_blocks
                WHERE exam_id = ?
                `,
                [examId]
            );

            await db.query(
                `
                INSERT INTO exam_blocks (
                    exam_id,
                    block_id,
                    sort_order
                )
                VALUES (?, ?, ?)
                `,
                [
                    examId,
                    blockId,
                    rows[0].nextOrder
                ]
            );

        }

        const [questionResult] = await db.query(
            `
            INSERT INTO questions (
                question,
                block_id,
                question_type,
                created_by,
                updated_by,
                answer_config
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                question,
                blockId,
                1,
                req.user.id,
                req.user.id,
                null
            ]
        );

        for (const pointRow of points) {

            await db.query(
                `
                INSERT INTO block_points (
                    block_id,
                    central_content_id,
                    grading_ability_level_id,
                    points
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    blockId,
                    pointRow.centralContentId,
                    pointRow.gradingAbilityLevelId,
                    pointRow.points
                ]
            );

        }


        for (const sectionId of sectionIds) {

            await db.query(
                `
                INSERT INTO block_sections (
                    block_id,
                    section_id
                )
                VALUES (?, ?)
                `,
                [
                    blockId,
                    sectionId
                ]
            );

        }

        res.status(201).json({
            id: blockId,
            questionId: questionResult.insertId
        });


        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: error.message
            });
        }
                
    

});


// PUT /api/blocks/:id
router.put("/:blockId", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE blocks
        SET name = ?,
        updated_by = ?
        WHERE id = ?
        `,
        [name, req.user.id, req.params.blockId]
    );

    res.sendStatus(204);
});
// DELETE /api/blocks/:id
router.delete("/:blockId", async (req, res) => {

    await db.query(
        `
        UPDATE blocks
        SET
        deleted_at = NOW(),
        updated_by = ?
        WHERE id = ?
        `,
        [req.user.id,req.params.blockId]
            );

            res.sendStatus(204);
});

// POST /api/blocks/:id/questions
router.post("/:id/questions", async (req, res) => {

    const {
        question = "",
        question_type = "text",
        answer_config = {}
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO questions(
            question,
            block_id,
            question_type,
            created_by,
            updated_by,
            answer_config
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            question,
            req.params.id,
            question_type,
            req.user.id,
            req.user.id,
            JSON.stringify(answer_config)
        ]
    );

    res.json({
        id: result.insertId
    });

});

// POST   /api/blocks/:id/options
// POST   /api/blocks/:id/attachments

// DELETE /api/blocks/:id/sections/:sectionId
router.delete("/:blockId/book-sections/:sectionId",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            DELETE FROM block_sections
            WHERE
                block_id = ?
                AND section_id = ?
            `,
            [
                req.params.blockId,
                req.params.sectionId
            ]
        );

        res.sendStatus(204);
    }
);

// POST   /api/blocks/:id/sections/:sectionId
router.post("/:blockId/book-sections/:sectionId",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            INSERT IGNORE INTO block_sections (
                block_id,
                section_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.blockId,
                req.params.sectionId
            ]
        );

        res.sendStatus(204);
    }
);

// POST   /api/blocks/:id/points
router.post("/:blockId/points", requireAuth,
    async (req, res) => {

        const {
            central_content_id,
            grading_ability_level_id,
            points
        } = req.body;

        if (
            !Number.isInteger(Number(points))
        ) {
            return res.status(400).json({
                error: "Poäng måste vara ett heltal."
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO block_points (
                block_id,
                central_content_id,
                grading_ability_level_id,
                points
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.params.blockId,
                central_content_id,
                grading_ability_level_id,
                points
            ]
        );

        res.status(201).json({
            id: result.insertId
        });

    }
);

// POST /api/blocks/import
router.post("/import",upload.single("file"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Ingen fil uppladdad"
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

            const [blockResult] =
                await db.query(
                    `
                    INSERT INTO blocks (
                        school_id,
                        created_by,
                        updated_by
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        teacher.school_id,
                        req.user.id,
                        req.user.id
                    ]
                );

            const blockId =
                blockResult.insertId;

            if (req.body.abilityId) {

                await db.query(
                    `
                    INSERT INTO block_abilities (
                        block_id,
                        ability_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        blockId,
                        req.body.abilityId
                    ]
                );

            }

            if (req.body.sectionId) {

                await db.query(
                    `
                    INSERT INTO block_sections (
                        block_id,
                        section_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        blockId,
                        req.body.sectionId
                    ]
                );

            }

            const workbook =
                XLSX.read(
                    req.file.buffer
                );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(
                    sheet
                );

            for (const row of rows) {

                const question =
                    row.Fråga ||
                    row.fråga ||
                    row.Question ||
                    row.question;

                if (!question) {
                    continue;
                }


                await db.query(
                    `
                    INSERT INTO questions (
                        block_id,
                        question,
                        question_type,
                        created_by,
                        updated_by
                    )
                    VALUES (
                        ?, ?, 'text', ?, ?
                    )
                    `,
                    [
                        blockId,
                        question,
                        req.user.id,
                        req.user.id
                    ]
                );

            }

            const [blocks] = await db.query(
                `
                SELECT *
                FROM blocks
                WHERE id = ?
                `,
                [blockId]
            );

            const [block] =
                await hydrateBlocks(blocks);

            res.json({
                success: true,
                blockId,
                questionCount: rows.length,
                block
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Import failed"
            });

        }

    }
);

// GET /api/blocks/:id/point-metadata
router.get("/:id/point-metadata",
    async (req, res) => {

        const [centralContent] =
            await db.query(
                `
                SELECT
                    cc.id,
                    cc.content

                FROM central_content cc

                ORDER BY cc.content
                `
            );

        const [gradingAbilityLevels] =
            await db.query(
                `
                SELECT
                    gal.id,

                    gal.level,

                    ga.name

                FROM grading_ability_levels gal

                JOIN grading_abilities ga
                    ON ga.id =
                        gal.grading_ability_id

                ORDER BY
                    ga.name,
                    gal.level
                `
            );

        res.json({
            centralContent,
            gradingAbilityLevels
        });

    }
);


// POST   /api/blocks/:id/copy
router.post("/:id/copy",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            await connection.beginTransaction();

            const { id } = req.params;

            const [[teacher]] =
                await connection.query(
                    `
                    SELECT school_id
                    FROM school_teachers
                    WHERE teacher_id = ?
                    `,
                    [req.user.id]
                );

            const schoolId =
                teacher?.school_id;

            const [[settings]] =
                await connection.query(
                    `
                    SELECT
                        enable_block_copying
                    FROM school_settings
                    WHERE school_id = ?
                    `,
                    [schoolId]
                );

            if (
                !settings?.enable_block_copying
            ) {

                return res.status(403).json({
                    error:
                        "Skolan tillåter inte kopiering."
                });

            }

            const [[block]] =
                await connection.query(
                    `
                    SELECT *
                    FROM blocks
                    WHERE id = ?
                        AND deleted_at IS NULL
                    `,
                    [id]
                );

            if (!block) {

                return res.status(404).json({
                    error:
                        "Blocket hittades inte."
                });

            }

            const canAccess =

                block.created_by ===
                req.user.id

                ||

                (
                    block.visibility ===
                        "school"
                    &&
                    block.school_id ===
                        schoolId
                )

                ||

                block.visibility ===
                    "global";

            if (!canAccess) {

                return res.status(403).json({
                    error:
                        "Du saknar behörighet."
                });

            }

            const [blockResult] =
                await connection.query(
                    `
                    INSERT INTO blocks (

                        created_by,
                        updated_by,

                        school_id,

                        visibility

                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        req.user.id,
                        req.user.id,
                        schoolId,
                        "private"
                    ]
                );

            const newBlockId =
                blockResult.insertId;

            /*
            * Kopiera poängkopplingar
            */
            await connection.query(
                `
                INSERT INTO block_points (
                    block_id,
                    central_content_id,
                    grading_ability_level_id,
                    points
                )
                SELECT
                    ?,
                    central_content_id,
                    grading_ability_level_id,
                    points
                FROM block_points
                WHERE block_id = ?
                `,
                [
                    newBlockId,
                    block.id
                ]
            );


            /*
             * Kopiera sektioner
             */
            await connection.query(
                `
                INSERT INTO
                    block_sections (
                        block_id,
                        section_id
                    )
                SELECT
                    ?,
                    section_id
                FROM block_sections
                WHERE block_id = ?
                `,
                [
                    newBlockId,
                    block.id
                ]
            );

            /*
            * Kopiera förmågor
            */
            await connection.query(
                `
                INSERT INTO block_abilities (
                    block_id,
                    ability_id
                )
                SELECT
                    ?,
                    ability_id
                FROM block_abilities
                WHERE block_id = ?
                `,
                [
                    newBlockId,
                    block.id
                ]
            );

            const [questions] =
                await connection.query(
                    `
                    SELECT *
                    FROM questions
                    WHERE block_id = ?
                        AND deleted_at IS NULL
                    `,
                    [block.id]
                );


            for (const question of questions) {

                const [questionResult] =
                    await connection.query(
                        `
                        INSERT INTO questions (

                            question,
                            block_id,
                            question_type,
                            level_id,

                            created_by,
                            updated_by,

                            answer_config

                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            question.question,
                            newBlockId,
                            question.question_type,
                            question.level_id,

                            req.user.id,
                            req.user.id,

                            question.answer_config
                        ]
                    );

                const newQuestionId =
                    questionResult.insertId;


                const [options] =
                    await connection.query(
                        `
                        SELECT *
                        FROM options
                        WHERE question_id = ?
                            AND deleted_at IS NULL
                        `,
                        [question.id]
                    );

                for (const option of options) {

                    await connection.query(
                        `
                        INSERT INTO options (

                            question_id,

                            text,
                            is_correct,

                            created_by,
                            updated_by

                        )
                        VALUES (?, ?, ?, ?, ?)
                        `,
                        [
                            newQuestionId,

                            option.text,
                            option.is_correct,

                            req.user.id,
                            req.user.id
                        ]
                    );

                }

                const [media] =
                    await connection.query(
                        `
                        SELECT *
                        FROM question_media
                        WHERE question_id = ?
                        ORDER BY sort_order
                        `,
                        [question.id]
                    );

                for (const mediaItem of media) {

                    await connection.query(
                        `
                        INSERT INTO question_media (

                            question_id,

                            media_type,
                            media_url,
                            sort_order

                        )
                        VALUES (?, ?, ?, ?)
                        `,
                        [
                            newQuestionId,

                            mediaItem.media_type,
                            mediaItem.media_url,
                            mediaItem.sort_order
                        ]
                    );

                }


            }        


            await connection.commit();

            res.status(201).json({
                id: newBlockId
            });

            } catch (error) {

                await connection.rollback();

                console.error(error);

                res.status(500).json({
                    error: error.message
                });

            }   finally {

                connection.release();
            
            }

    }
);

//GET /api/blocks/:id/abilities
router.get("/:id/abilities",
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                a.*
            FROM abilities a
            JOIN block_abilities ba
                ON ba.ability_id = a.id
            WHERE ba.block_id = ?
            ORDER BY a.name
            `,
            [req.params.id]
        );

        res.json(rows);

    }
);

//POST /api/blocks/:id/abilities/:abilityId
router.post("/:id/abilities/:abilityId",
    async (req, res) => {

        await db.query(
            `
            INSERT IGNORE INTO block_abilities (
                block_id,
                ability_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.id,
                req.params.abilityId
            ]
        );

        res.sendStatus(204);

    }
);

//DELETE /api/blocks/:id/abilities/:abilityId
router.delete("/:id/abilities/:abilityId",
    async (req, res) => {

        await db.query(
            `
            DELETE
            FROM block_abilities
            WHERE block_id = ?
            AND ability_id = ?
            `,
            [
                req.params.id,
                req.params.abilityId
            ]
        );

        res.sendStatus(204);

    }
);


//GET /api/teacher/blocks/question-levels
router.get("/question-levels", async (req, res) => {

    try {

        const [levels] = await db.query(`
            SELECT *
            FROM question_levels
            ORDER BY sort_order
        `);

        res.json(levels);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});

// POST /api/blocks/:blockId/questions
router.post("/:blockId/questions", async (req, res) => {

    const {
        question = "",
        question_type = 1,
        answer_config = {}
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO questions(
            question,
            block_id,
            question_type,
            created_by,
            updated_by,
            answer_config
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            question,
            req.params.blockId,
            question_type,
            req.user.id,
            req.user.id,
            JSON.stringify(answer_config)
        ]
    );

    res.json({
        id: result.insertId
    });

});


// DELETE /api/teacher/questions/:questionId
router.delete("/questions/:questionId", async (req, res) => {


        const connection =
            await db.getConnection();

        try {

            const settings =
                await getAppSettings(
                    connection
                );

            const [
                questionRows
            ] = await connection.query(
                `
                SELECT
                    block_id
                FROM questions
                WHERE id = ?
                    AND deleted_at IS NULL
                `,
                [
                    req.params.questionId
                ]
            );

            if (
                questionRows.length === 0
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Frågan hittades inte."
                    });

            }

            const blockId =
                questionRows[0].block_id;

            if (
                !settings.first_question_in_block_can_be_deleted
            ) {

                const [countRows] =
                    await connection.query(
                        `
                        SELECT COUNT(*) AS count
                        FROM questions
                        WHERE block_id = ?
                            AND deleted_at IS NULL
                        `,
                        [blockId]
                    );

                if (
                    countRows[0].count <= 1
                ) {

                    return res
                        .status(400)
                        .json({
                            error:
                                "Den sista frågan i ett block kan inte tas bort."
                        });

                }

            }

            await connection.query(
                `
                UPDATE questions
                SET
                    deleted_at = NOW(),
                    updated_at = NOW(),
                    updated_by = ?
                WHERE id = ?
                `,
                [
                    req.user.id,
                    req.params.questionId
                ]
            );

            res.sendStatus(204);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte ta bort frågan."
            });

        } finally {

            connection.release();

        }

    }
);

// POST /api/teacher/blocks/questions/:questionId/options
router.post("/questions/:questionId/options", async (req, res) => {

    const {
        text,
        is_correct
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO options(
            question_id,
            text,
            is_correct,
            created_by,
            updated_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            req.params.questionId,
            text,
            is_correct,
            req.user.id,
            req.user.id
        ]
    );

    res.json({
        id: result.insertId
    });

});

// PUT /api/teacher/blocks/options/:optionId
router.put("/options/:optionId", async (req, res) => {

    const { text, is_correct } = req.body;

    await db.query(
        `
        UPDATE options
        SET
            text = ?,
            is_correct = ?
        WHERE id = ?
        `,
        [
            text,
            is_correct,
            req.params.optionId
        ]
    );

    res.sendStatus(204);
});

// DELETE /api/teacher/blocks/questions/:questionId
router.delete("/options/:optionId", async (req, res) => {

    await db.query(
        `
        UPDATE options
        SET deleted_at = NOW()
        WHERE id = ?
        `,
        [req.params.optionId]
    );

    res.sendStatus(204);
});


// GET /api/blocks/:blockId/points
router.get("/:id/points",
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                bp.*,

                cc.content AS central_content,

                ga.name AS grading_ability,

                gal.level

            FROM block_points bp

            JOIN central_content cc
                ON cc.id =
                    bp.central_content_id

            JOIN grading_ability_levels gal
                ON gal.id =
                    bp.grading_ability_level_id

            JOIN grading_abilities ga
                ON ga.id =
                    gal.grading_ability_id

            WHERE bp.block_id = ?
            `,
            [req.params.id]
        );

        res.json(rows);

    }
);

// POST /api/blocks/:id/points
router.post("/:id/points",
    async (req, res) => {

        const {
            central_content_id,
            grading_ability_level_id,
            points
        } = req.body;

        const [result] = await db.query(
            `
            INSERT INTO block_points (
                block_id,
                central_content_id,
                grading_ability_level_id,
                points
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.params.id,
                central_content_id,
                grading_ability_level_id,
                points
            ]
        );

        res.json({
            id: result.insertId
        });

    }
);

export default router;