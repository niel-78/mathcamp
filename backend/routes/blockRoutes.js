import express from "express";
import crypto from "node:crypto";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { normalizeImportRows } from "../helpers/normalizeImportRows.js";
import {
    createImportJob,
    getImportJob,
    updateImportJob,
    removeImportJob
} from "../helpers/importJobStore.js";
import { autoFixMultipleQuestions } from "../utils/autoFixQuestion.js";

import { getAppSettings } from "../utils/getAppSettings.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

const importHeaders = [
    "Fråga",
    "Frågetyp",
    "Nivå",
    "Korrekta alternativ",
    "Miniräknare tillåten",
    "Alternativ 1",
    "Alternativ 2",
    "Alternativ 3",
    "Alternativ 4",
    "Alternativ 5"
];

function readImportRows(workbook) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.some(row => row.Fråga || row.fråga || row.Question || row.question)) {
        return rows;
    }

    return XLSX.utils.sheet_to_json(sheet, {
        header: importHeaders,
        defval: ""
    });
}

async function getNextBlockAbilityProgression(connection = db, abilityId) {
    const [[row]] = await connection.query(
        `
        SELECT COALESCE(MAX(progression), 0) + 1 AS nextProgression
        FROM block_abilities
        WHERE ability_id = ?
        `,
        [abilityId]
    );

    return Number(row.nextProgression || 1);
}

router.use(requireAuth);
router.use(requireRole("teacher","super"));

async function processBlockImportJob({
    jobId,
    fileBuffer,
    csvText,
    userId,
    abilityId,
    sectionId,
    centralContentId
}) {
    const job = getImportJob(jobId);

    if (!job) {
        return;
    }

    try {
        updateImportJob(jobId, {
            status: "processing",
            message: "Kontrollerar importdata...",
            progress: 5
        });

        const [[teacher]] = await db.query(
            `
            SELECT school_id
            FROM school_teachers
            WHERE teacher_id = ?
            `,
            [userId]
        );

        if (!teacher?.school_id) {
            throw new Error("Användaren är inte kopplad till en skola");
        }

        let ability = null;

        if (abilityId) {
            [[ability]] = await db.query(
                `
                SELECT id, series_id
                FROM abilities
                WHERE id = ?
                AND deleted_at IS NULL
                `,
                [abilityId]
            );

            if (!ability) {
                throw new Error("Förmågan hittades inte");
            }
        }

        const workbook = csvText
            ? XLSX.read(csvText, { type: "string" })
            : XLSX.read(fileBuffer);
        const rows = readImportRows(workbook);

        const [levels] = ability?.series_id
            ? await db.query(
                `
                SELECT id
                FROM ability_series_levels
                WHERE series_id = ?
                ORDER BY sort_order
                `,
                [ability.series_id]
            )
            : [[]];

        const { questions } = normalizeImportRows({
            rows,
            blockId: null,
            userId,
            abilityLevels: levels
        });

        const [blockResult] = await db.query(
            `
            INSERT INTO blocks (
                school_id,
                created_by,
                updated_by,
                title
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                teacher.school_id,
                userId,
                userId,
                "Nytt block"
            ]
        );

        const blockId = blockResult.insertId;

        updateImportJob(jobId, {
            blockId,
            message: "Sparar blockinställningar..."
        });

        if (ability) {
            await db.query(
                `
                INSERT INTO block_abilities (
                    block_id,
                    ability_id,
                    progression
                )
                VALUES (?, ?, ?)
                `,
                [
                    blockId,
                    ability.id,
                    await getNextBlockAbilityProgression(db, ability.id)
                ]
            );
        }

        if (sectionId) {
            await db.query(
                `
                INSERT INTO block_sections (
                    block_id,
                    section_id
                )
                VALUES (?, ?)
                `,
                [blockId, sectionId]
            );
        }

        for (const question of questions) {
            question.blockId = blockId;
        }

        updateImportJob(jobId, {
            totalRows: Math.max(rows.length, 1),
            processedRows: 0,
            questionCount: questions.length,
            message: `Bearbetar ${questions.length} frågor...`
        });

        if (questions.length === 0) {
            updateImportJob(jobId, {
                status: "completed",
                progress: 100,
                message: "Importen klar. Inga frågor hittades.",
                questionCount: 0,
                blockId
            });
            return;
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const questionInsertValues = questions.map(question => [
                question.blockId,
                question.question,
                question.questionType,
                question.seriesLevelId,
                question.calculatorAllowed ? 1 : 0,
                question.geogebraAllowed ? 1 : 0,
                question.userId,
                question.userId,
                JSON.stringify(question.answerConfig)
            ]);

            await connection.query(
                `
                INSERT INTO questions (
                    block_id,
                    question,
                    question_type,
                    series_level_id,
                    calculator_allowed,
                    geogebra_allowed,
                    created_by,
                    updated_by,
                    answer_config
                )
                VALUES ?
                `,
                [questionInsertValues]
            );

            const [insertedQuestionIds] = await connection.query(
                `
                SELECT id
                FROM questions
                WHERE block_id = ?
                AND created_by = ?
                AND deleted_at IS NULL
                AND archived_at IS NULL
                ORDER BY id DESC
                LIMIT ?
                `,
                [blockId, userId, questions.length]
            );

            const questionIds = [...insertedQuestionIds]
                .map(row => Number(row.id))
                .reverse();

            const optionRows = [];
            for (let i = 0; i < questions.length; i++) {
                const questionId = questionIds[i];
                if (!questionId) {
                    continue;
                }

                for (const option of questions[i].options) {
                    optionRows.push([
                        questionId,
                        option.text,
                        option.isCorrect,
                        userId,
                        userId
                    ]);
                }

                if (questions[i].imageUrl) {
                    await connection.query(
                        `
                        INSERT INTO question_media (
                            question_id,
                            media_type,
                            media_url,
                            sort_order
                        )
                        VALUES (?, 'image', ?, 0)
                        `,
                        [questionId, questions[i].imageUrl]
                    );
                }

                updateImportJob(jobId, {
                    processedRows: i + 1,
                    message: `Sparar fråga ${i + 1} av ${questions.length}`
                });
            }

            if (optionRows.length > 0) {
                await connection.query(
                    `
                    INSERT INTO options (
                        question_id,
                        text,
                        is_correct,
                        created_by,
                        updated_by
                    )
                    VALUES ?
                    `,
                    [optionRows]
                );
            }

            await connection.commit();

            const [blocks] = await db.query(
                `
                SELECT *
                FROM blocks
                WHERE id = ?
                `,
                [blockId]
            );

            const [block] = await hydrateBlocks(blocks);

            updateImportJob(jobId, {
                status: "completed",
                progress: 100,
                processedRows: rows.length,
                message: "Importen klar.",
                questionCount: questions.length,
                blockId,
                block
            });

            setTimeout(
                () => removeImportJob(jobId),
                5 * 60 * 1000
            ).unref();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("BLOCK IMPORT JOB FAILED", error);
        updateImportJob(jobId, {
            status: "failed",
            progress: 0,
            message: error.message || "Importen misslyckades.",
            error: error.message || "Importen misslyckades."
        });
    }
}

async function hydrateLightBlocks(blocks) {

    if (!blocks.length) {
        return [];
    }

    const blockIds = blocks.map(block => block.id);

    const [questions] = await db.query(
        `
        SELECT
            q.block_id,
            q.id,
            q.question,
            q.question_type,
            q.level_id,
            q.answer_config,
            q.calculator_allowed,
            q.geogebra_allowed,
            bqp.question_id IS NOT NULL AS is_priority,
            COALESCE(report_counts.report_count, 0) AS report_count
        FROM questions q
        LEFT JOIN block_question_priorities bqp
            ON bqp.question_id = q.id
            AND bqp.block_id = q.block_id
        LEFT JOIN (
            SELECT
                question_id,
                COUNT(*) AS report_count
            FROM question_reports
            WHERE report_type = 'missing_correct_option'
            GROUP BY question_id
        ) report_counts
            ON report_counts.question_id = q.id
        WHERE q.block_id IN (?)
        AND q.deleted_at IS NULL
        AND q.archived_at IS NULL
        ORDER BY q.block_id, q.id
        `,
        [blockIds]
    );

    const questionIds = questions.map(q => q.id);

    const optionsByQuestionId = new Map();
    const mediaByQuestionId = new Map();
    if (questionIds.length > 0) {
        const [options] = await db.query(
            `
            SELECT id, question_id, text, is_correct
            FROM options
            WHERE question_id IN (?)
            AND deleted_at IS NULL
            ORDER BY id
            `,
            [questionIds]
        );

        for (const option of options) {
            const list = optionsByQuestionId.get(option.question_id) || [];
            list.push(option);
            optionsByQuestionId.set(option.question_id, list);
        }

        const [mediaItems] = await db.query(
            `
            SELECT id, question_id, media_type, media_url, sort_order
            FROM question_media
            WHERE question_id IN (?)
            ORDER BY question_id, sort_order
            `,
            [questionIds]
        );

        for (const mediaItem of mediaItems) {
            const list = mediaByQuestionId.get(mediaItem.question_id) || [];
            list.push(mediaItem);
            mediaByQuestionId.set(mediaItem.question_id, list);
        }
    }

    for (const q of questions) {
        q.options = optionsByQuestionId.get(q.id) || [];
        q.media = mediaByQuestionId.get(q.id) || [];
    }

    const questionsByBlock = new Map();
    for (const q of questions) {
        const bId = Number(q.block_id);
        const list = questionsByBlock.get(bId) || [];
        list.push(q);
        questionsByBlock.set(bId, list);
    }

    const [pointRows] = await db.query(
        `
        SELECT block_id, id, points
        FROM block_points
        WHERE block_id IN (?)
        `,
        [blockIds]
    );

    const [abilityRows] = await db.query(
        `
        SELECT ba.block_id, ba.progression, a.id, a.name
        FROM block_abilities ba
        JOIN abilities a
            ON a.id = ba.ability_id
        WHERE ba.block_id IN (?)
        ORDER BY ba.block_id, ba.progression, a.name
        `,
        [blockIds]
    );

    const [sectionRows] = await db.query(
        `
        SELECT
            bs.block_id,
            s.id,
            s.title,
            sc.id AS subchapter_id,
            sc.title AS subchapter_title,
            c.id AS chapter_id,
            c.title AS chapter_title,
            b.id AS book_id,
            b.title AS book_title,
            l.id AS course_level_id,
            l.name AS course_level_name,
            l.code AS course_level_code,
            l.subject_id
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
        WHERE bs.block_id IN (?)
        ORDER BY bs.block_id, b.title, s.title
        `,
        [blockIds]
    );

    const [pointDetailRows] = await db.query(
        `
        SELECT DISTINCT
            bp.block_id,
            cc.id AS central_content_id,
            cc.content AS central_content,
            ca.id AS area_id,
            ca.title AS area_title,
            l.id AS course_level_id,
            l.name AS course_level_name,
            l.code AS course_level_code,
            l.subject_id,
            sub.name AS subject_name
        FROM block_points bp
        LEFT JOIN central_content cc
            ON cc.id = bp.central_content_id
        LEFT JOIN content_areas ca
            ON ca.id = cc.area_id
        LEFT JOIN competency_descriptors cd
            ON cd.id = bp.competency_descriptor_id
        LEFT JOIN levels l
            ON l.id = COALESCE(ca.level_id, cd.level_id)
        LEFT JOIN subjects sub
            ON sub.id = l.subject_id
        WHERE bp.block_id IN (?)
        `,
        [blockIds]
    );

    const pointCountByBlock = new Map();
    const totalPointsByBlock = new Map();
    for (const row of pointRows) {
        const blockId = Number(row.block_id);
        pointCountByBlock.set(blockId, (pointCountByBlock.get(blockId) || 0) + 1);
        totalPointsByBlock.set(blockId, (totalPointsByBlock.get(blockId) || 0) + Number(row.points || 0));
    }

    const abilitiesByBlock = new Map();
    for (const row of abilityRows) {
        const blockId = Number(row.block_id);
        if (!abilitiesByBlock.has(blockId)) {
            abilitiesByBlock.set(blockId, []);
        }
        abilitiesByBlock.get(blockId).push({
            id: row.id,
            name: row.name,
            progression: row.progression
        });
    }

    const sectionsByBlock = new Map();
    const booksByBlock = new Map();
    const chaptersByBlock = new Map();
    const subchaptersByBlock = new Map();
    const coursesByBlock = new Map();
    const subjectsByBlock = new Map();
    const areasByBlock = new Map();
    const centralContentByBlock = new Map();

    for (const row of sectionRows) {
        const blockId = Number(row.block_id);
        if (!sectionsByBlock.has(blockId)) {
            sectionsByBlock.set(blockId, []);
        }
        sectionsByBlock.get(blockId).push({
            id: row.id,
            title: row.title,
            subchapter_id: row.subchapter_id,
            subchapter_title: row.subchapter_title,
            chapter_id: row.chapter_id,
            chapter_title: row.chapter_title,
            book_id: row.book_id,
            book_title: row.book_title,
            course_level_id: row.course_level_id,
            course_level_name: row.course_level_name,
            course_level_code: row.course_level_code,
            subject_id: row.subject_id
        });

        if (row.book_id) {
            if (!booksByBlock.has(blockId)) {
                booksByBlock.set(blockId, new Map());
            }
            booksByBlock.get(blockId).set(row.book_id, {
                id: row.book_id,
                title: row.book_title
            });
        }

        if (row.chapter_id) {
            if (!chaptersByBlock.has(blockId)) {
                chaptersByBlock.set(blockId, new Map());
            }
            chaptersByBlock.get(blockId).set(row.chapter_id, {
                id: row.chapter_id,
                title: row.chapter_title,
                book_id: row.book_id
            });
        }

        if (row.subchapter_id) {
            if (!subchaptersByBlock.has(blockId)) {
                subchaptersByBlock.set(blockId, new Map());
            }
            subchaptersByBlock.get(blockId).set(row.subchapter_id, {
                id: row.subchapter_id,
                title: row.subchapter_title,
                chapter_id: row.chapter_id
            });
        }

        if (row.course_level_id) {
            if (!coursesByBlock.has(blockId)) {
                coursesByBlock.set(blockId, new Map());
            }
            coursesByBlock.get(blockId).set(row.course_level_id, {
                id: row.course_level_id,
                name: row.course_level_name,
                code: row.course_level_code,
                subject_id: row.subject_id
            });
        }

        if (row.subject_id) {
            if (!subjectsByBlock.has(blockId)) {
                subjectsByBlock.set(blockId, new Map());
            }
            subjectsByBlock.get(blockId).set(row.subject_id, {
                id: row.subject_id
            });
        }
    }

    for (const row of pointDetailRows) {
        const blockId = Number(row.block_id);
        if (row.course_level_id) {
            if (!coursesByBlock.has(blockId)) {
                coursesByBlock.set(blockId, new Map());
            }
            coursesByBlock.get(blockId).set(row.course_level_id, {
                id: row.course_level_id,
                name: row.course_level_name,
                code: row.course_level_code,
                subject_id: row.subject_id
            });
        }

        if (row.subject_id) {
            if (!subjectsByBlock.has(blockId)) {
                subjectsByBlock.set(blockId, new Map());
            }
            subjectsByBlock.get(blockId).set(row.subject_id, {
                id: row.subject_id,
                name: row.subject_name
            });
        }

        if (row.area_id) {
            if (!areasByBlock.has(blockId)) {
                areasByBlock.set(blockId, new Map());
            }
            areasByBlock.get(blockId).set(row.area_id, {
                id: row.area_id,
                title: row.area_title,
                level_id: row.course_level_id
            });
        }

        if (row.central_content_id) {
            if (!centralContentByBlock.has(blockId)) {
                centralContentByBlock.set(blockId, new Map());
            }
            centralContentByBlock.get(blockId).set(row.central_content_id, {
                id: row.central_content_id,
                content: row.central_content,
                area_id: row.area_id,
                level_id: row.course_level_id
            });
        }
    }

    for (const block of blocks) {
        const blockId = Number(block.id);
        const blockQuestions = questionsByBlock.get(blockId) || [];

        block.questions = blockQuestions;
        block.question_count = blockQuestions.length;
        block.priority_question_count = blockQuestions.filter(
            question => Boolean(question.is_priority)
        ).length;

        const pointsCount = pointCountByBlock.get(blockId) || 0;
        block.points = pointsCount
            ? pointRows.filter(row => Number(row.block_id) === blockId)
            : [];
        block.point_count = pointsCount;
        block.total_points = totalPointsByBlock.get(blockId) || 0;

        block.abilities = abilitiesByBlock.get(blockId) || [];
        block.bookSections = sectionsByBlock.get(blockId) || [];
        block.books = Array.from((booksByBlock.get(blockId) || new Map()).values());
        block.chapters = Array.from((chaptersByBlock.get(blockId) || new Map()).values());
        block.subchapters = Array.from((subchaptersByBlock.get(blockId) || new Map()).values());
        block.courses = Array.from((coursesByBlock.get(blockId) || new Map()).values());
        block.levels = block.courses;
        block.subjects = Array.from((subjectsByBlock.get(blockId) || new Map()).values());
        block.areas = Array.from((areasByBlock.get(blockId) || new Map()).values());
        block.centralContent = Array.from((centralContentByBlock.get(blockId) || new Map()).values());
    }

    return blocks;
}

// GET /api/blocks/import-template
router.get("/import-template", async (req, res) => {

    const workbook =
        XLSX.utils.book_new();

    const worksheet =
        XLSX.utils.json_to_sheet([
            {
                Fråga: "Beräkna $7 \\cdot 8$",
                Frågetyp: "text",
                Nivå: 1,
                "Miniräknare tillåten": "Nej",
                "GeoGebra tillåten": "Nej",
                "Bild (URL)": "",
                "Korrekta alternativ": "56",
                "Ordning spelar ingen roll": "Nej"
            },
            {
                Fråga: "Vilket uttryck är lika med $x^2$?",
                Frågetyp: "single_choice",
                Nivå: 2,
                "Miniräknare tillåten": "Nej",
                "GeoGebra tillåten": "Nej",
                "Bild (URL)": "",
                "Korrekta alternativ": "3",
                "Ordning spelar ingen roll": "Nej",
                "Alternativ 1": "$2x$",
                "Alternativ 2": "$x+2$",
                "Alternativ 3": "$x \\cdot x$",
                "Alternativ 4": "$2x^2$"
            },
            {
                Fråga: "Vilka av följande tal är lösningar till $x^2 = 25$?",
                Frågetyp: "multiple_choice",
                Nivå: 3,
                "Miniräknare tillåten": "Ja",
                "GeoGebra tillåten": "Ja",
                "Bild (URL)": "https://example.com/diagram.png",
                "Korrekta alternativ": "2,4",
                "Ordning spelar ingen roll": "Nej",
                "Alternativ 1": "$0$",
                "Alternativ 2": "$5$",
                "Alternativ 3": "$10$",
                "Alternativ 4": "$-5$"
            },
            {
                Fråga: "Lös ekvationen $2x + 4 = 10$. Skriv $x = {{input}}$.",
                Frågetyp: "numeric_input",
                Nivå: 1,
                "Miniräknare tillåten": "Ja",
                "GeoGebra tillåten": "Ja",
                "Bild (URL)": "",
                "Korrekta alternativ": "3",
                "Ordning spelar ingen roll": "Nej"
            },
            {
                Fråga: "Bestäm koordinaterna: $x = {{input}}$, $y = {{input}}$.",
                Frågetyp: "numeric_input",
                Nivå: 2,
                "Miniräknare tillåten": "Nej",
                "GeoGebra tillåten": "Nej",
                "Bild (URL)": "",
                "Korrekta alternativ": "3; -2",
                "Ordning spelar ingen roll": "Nej"
            },
            {
                Fråga: "Lös $x^2 = 25$.",
                Frågetyp: "equation",
                Nivå: 2,
                "Miniräknare tillåten": "Nej",
                "GeoGebra tillåten": "Nej",
                "Bild (URL)": "",
                "Korrekta alternativ": "-5; 5",
                "Ordning spelar ingen roll": "Ja"
            }
        ]);

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Frågor"
    );

    const instructionSheet =
        XLSX.utils.aoa_to_sheet([
            ["Instruktioner"],
            [],
            ["Frågetyp kan vara:"],
            ["text"],
            ["single_choice"],
            ["multiple_choice"],
            ["numeric_input"],
            ["equation"],
            [],
            ["Nivå"],
            ["Ange nivånummer i serien."],
            ["1 = första svårighetsgraden"],
            ["2 = andra svårighetsgraden"],
            ["3 = tredje svårighetsgraden"],
            ["4 = fjärde svårighetsgraden"],
            ["osv."],
            [],
            ["LaTeX kan användas i frågor och alternativ."],
            ["GeoGebra tillåten → Ja/Nej eller 1/0 i kolumnen 'GeoGebra tillåten'"],
            ["Bild (URL) → valfri bildadress som visas till frågan. Lämna tomt om bilden saknas."],
            ["Exempel:"],
            ["$x^2 + 2x + 1$"],
            ["$\\frac{3}{4}$"],
            ["$\\sqrt{16}$"],
            ["$\\pi r^2$"],
            [],
            ["text → skriv rätt svar i kolumnen 'Svar' eller 'Korrekta alternativ'"],
            ["single_choice → skriv numret på rätt alternativ, t.ex. 2"],
            ["multiple_choice → skriv flera nummer, t.ex. 1,3,4"],
            [],
            ["NUMERIC INPUT - steg för steg"],
            ["1. Skriv numeric_input i kolumnen 'Frågetyp'."],
            ["2. Skriv exakt en {{input}}-markör i frågetexten för varje fast svarsruta."],
            ["3. Skriv rätt svar i samma ordning i 'Korrekta alternativ'. Använd semikolon mellan flera svar."],
            ["4. numeric_input har alltid fasta svarsrutor; eleven kan inte lägga till eller ta bort rutor."],
            [],
            ["Ett svar:"],
            ["Fråga: Beräkna $7 + 5$."],
            ["Korrekta alternativ: 12"],
            ["Ordning spelar ingen roll: Nej"],
            [],
            ["Flera svar i bestämd ordning:"],
            ["Fråga: Bestäm $x = {{input}}$ och $y = {{input}}$."],
            ["Korrekta alternativ: 3; -2"],
            ["Ordning spelar ingen roll: Nej"],
            [],
            ["EQUATION - valfritt antal svar (t.ex. rötter):"],
            ["1. Skriv equation i kolumnen 'Frågetyp'."],
            ["2. Frågetexten ska inte innehålla {{input}}."],
            ["3. Skriv alla godkända svar separerade med semikolon."],
            ["4. Sätt 'Ordning spelar ingen roll' till Ja."],
            ["Fråga: Lös ekvationen $x^2 = 25$."],
            ["Korrekta alternativ: -5; 5"],
            ["Ordning spelar ingen roll: Ja"],
            ["Eleven kan då lägga till eller ta bort svarsrutor."],
            [],
            ["Frågetyp: equation. Frågetexten behöver inte innehålla {{input}}."],
            ["Decimaltal kan skrivas med komma eller punkt, t.ex. 2,5 eller 2.5."]
        ]);

    XLSX.utils.book_append_sheet(
        workbook,
        instructionSheet,
        "Instruktioner"
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
        'attachment; filename="block-mall.xlsx"'
    );

    res.send(buffer);

});

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

                ORDER BY b.id
                `,
                [
                    req.params.sectionId,
                    req.user.id,
                    schoolId
                ]
            );

        const hydratedBlocks =
            await hydrateLightBlocks(blocks);

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
            b.*,
            ba.progression AS ability_progression
        FROM blocks b

        INNER JOIN block_abilities ba
            ON ba.block_id = b.id

        WHERE
            ba.ability_id = ?
            AND b.deleted_at IS NULL
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

        ORDER BY ba.progression, b.id
        `,
        [
            req.params.abilityId,
            req.user.id,
            schoolId
        ]
    );

    const hydratedBlocks = await hydrateLightBlocks(blocks);

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
        await hydrateBlocks(blocks, req.query.groupId);

    if (!hydratedBlocks.length) {

        return res.status(404).json({
            error: "Block not found"
        });

    }

    hydratedBlocks[0].isOwner = hydratedBlocks[0].created_by === req.user.id;

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

    let schoolSettings = null;

    if (schoolId) {

        [[schoolSettings]] =
            await db.query(
                `
                SELECT
                    enable_block_copying
                FROM school_settings
                WHERE school_id = ?
                `,
                [schoolId]
            );

    }

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

                ORDER BY b.id
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

                ORDER BY b.id
                `,
                [
                    req.user.id,
                    schoolId ?? null
                ]
            );

        }

    const hydratedBlocks =
        await hydrateLightBlocks(
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
            questions,
            questionType = "numeric_input",
            levelId = null,
            calculatorAllowed = false,
            geogebraAllowed = false,
            calculateAnswers = true,
            abilityId = null,
            points = [],
            centralContentIds = [],
            sectionIds = [],
            assessmentId,
            visibility = "school"
        } = req.body;

        const questionTexts = (Array.isArray(questions) ? questions : [question])
            .map(value => String(value ?? "").trim())
            .filter(Boolean);

        if (questionTexts.length === 0) {
            return res.status(400).json({
                error: "Minst en fråga måste anges."
            });
        }

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

        const blockTitle = questionTexts[0].substring(0, 100);

        const [blockResult] = await db.query(
            `
                INSERT INTO blocks (
                    created_by,
                    updated_by,
                    school_id,
                    visibility,
                    title
                )
                VALUES (?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                req.user.id,
                school?.school_id || null,
                visibility,
                blockTitle
            ]
        );

        const blockId = blockResult.insertId;

        if (assessmentId) {

            const [rows] = await db.query(
                `
                SELECT
                    COALESCE(MAX(sort_order), 0) + 1
                    AS nextOrder
                FROM assessment_blocks
                WHERE assessment_id = ?
                `,
                [assessmentId]
            );

            await db.query(
                `
                INSERT INTO assessment_blocks (
                    assessment_id,
                    block_id,
                    sort_order
                )
                VALUES (?, ?, ?)
                `,
                [
                    assessmentId,
                    blockId,
                    rows[0].nextOrder
                ]
            );

        }

        const questionIds = [];

        for (const questionText of questionTexts) {
            const [questionResult] = await db.query(
                `
                INSERT INTO questions (
                    question,
                    block_id,
                    question_type,
                    level_id,
                    calculator_allowed,
                    geogebra_allowed,
                    created_by,
                    updated_by,
                    answer_config
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    questionText,
                    blockId,
                    questionType,
                    levelId || null,
                    calculatorAllowed ? 1 : 0,
                    geogebraAllowed ? 1 : 0,
                    req.user.id,
                    req.user.id,
                    JSON.stringify({})
                ]
            );

            questionIds.push(questionResult.insertId);
        }

        if (calculateAnswers) {
            await autoFixMultipleQuestions(questionIds, req.user.id);
        }

        for (const pointRow of points) {

            await db.query(
                `
                INSERT INTO block_points (
                    block_id,
                    central_content_id,
                    competency_descriptor_id,
                    points
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    blockId,
                    pointRow.centralContentId,
                    pointRow.competencyDescriptorId,
                    pointRow.points
                ]
            );

        }

        for (const centralContentId of centralContentIds) {
            await db.query(
                `
                INSERT INTO block_points (
                    block_id,
                    central_content_id,
                    points
                )
                VALUES (?, ?, 1)
                `,
                [blockId, centralContentId]
            );
        }

        if (abilityId) {
            await db.query(
                `
                INSERT INTO block_abilities (
                    block_id,
                    ability_id,
                    progression
                )
                VALUES (?, ?, ?)
                `,
                [
                    blockId,
                    abilityId,
                    await getNextBlockAbilityProgression(db, abilityId)
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
            questionId: questionIds[0],
            questionIds
        });


        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: error.message
            });
        }
                
    

});

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
            competency_descriptor_id,
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
                competency_descriptor_id,
                points
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.params.blockId,
                central_content_id,
                competency_descriptor_id,
                points
            ]
        );

        res.status(201).json({
            id: result.insertId
        });

    }
);

// POST /api/blocks/import
router.post("/import/validate", async (req, res) => {
    try {
        const csvText = req.body?.csvText;

        if (!csvText?.trim()) {
            return res.status(400).json({
                error: "Ingen CSV-text angiven"
            });
        }

        const workbook = XLSX.read(csvText, { type: "string" });
    const rows = readImportRows(workbook);

        let abilityLevels = [];

        if (req.body.abilityId) {
            const [[ability]] = await db.query(
                `
                SELECT series_id
                FROM abilities
                WHERE id = ?
                AND deleted_at IS NULL
                `,
                [req.body.abilityId]
            );

            if (!ability) {
                return res.status(400).json({
                    error: "Förmågan hittades inte"
                });
            }

            [abilityLevels] = await db.query(
                `
                SELECT id
                FROM ability_series_levels
                WHERE series_id = ?
                ORDER BY sort_order
                `,
                [ability.series_id]
            );
        }

        const { questions } = normalizeImportRows({
            rows,
            blockId: null,
            userId: req.user.id,
            abilityLevels
        });

        return res.json({
            valid: true,
            questionCount: questions.length
        });
    } catch (error) {
        return res.status(400).json({
            valid: false,
            error: error.message || "CSV-texten kunde inte valideras"
        });
    }
});

router.post("/import", upload.single("file"), async (req, res) => {
    try {
        const csvText = req.file ? null : req.body.csvText;

        if (!req.file && !csvText) {
            return res.status(400).json({
                error: "Ingen fil eller CSV-text angiven"
            });
        }

        const jobId = crypto.randomUUID();

        createImportJob({
            jobId,
            fileName: req.file ? req.file.originalname : "csv-text",
            userId: req.user.id
        });

        void processBlockImportJob({
            jobId,
            fileBuffer: req.file ? req.file.buffer : null,
            csvText,
            userId: req.user.id,
            abilityId: req.body.abilityId || null,
            sectionId: req.body.sectionId || null,
            centralContentId: req.body.centralContentId || null
        });

        res.status(202).json({
            success: true,
            jobId,
            status: "queued"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Import failed"
        });
    }
});

router.get("/import/jobs/:jobId", async (req, res) => {
    const job = getImportJob(req.params.jobId);

    if (!job) {
        return res.status(404).json({
            error: "Jobb hittades inte"
        });
    }

    res.json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        questionCount: job.questionCount,
        blockId: job.blockId,
        block: job.block || null,
        error: job.error || null
    });
});

// POST /api/blocks/:id/split
router.post("/:id/split",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const blockId = Number(req.params.id);
            const questionIds = [...new Set(
                (Array.isArray(req.body?.questionIds) ? req.body.questionIds : [])
                    .map(questionId => Number(questionId))
                    .filter(Number.isInteger)
            )];

            if (!Number.isInteger(blockId) || blockId <= 0) {
                return res.status(400).json({
                    error: "Ogiltigt block."
                });
            }

            if (questionIds.length === 0) {
                return res.status(400).json({
                    error: "Välj minst en uppgift att flytta."
                });
            }

            await connection.beginTransaction();

            const [[block]] = await connection.query(
                `
                SELECT *
                FROM blocks
                WHERE id = ?
                    AND deleted_at IS NULL
                    AND archived_at IS NULL
                FOR UPDATE
                `,
                [blockId]
            );

            if (!block) {
                await connection.rollback();
                return res.status(404).json({
                    error: "Blocket hittades inte."
                });
            }

            const canEdit =
                req.user.role === "super" ||
                block.created_by === req.user.id;

            if (!canEdit) {
                await connection.rollback();
                return res.status(403).json({
                    error: "Du saknar behörighet att dela blocket."
                });
            }

            const [allQuestions] = await connection.query(
                `
                SELECT id, question
                FROM questions
                WHERE block_id = ?
                    AND deleted_at IS NULL
                    AND archived_at IS NULL
                ORDER BY id
                FOR UPDATE
                `,
                [blockId]
            );

            const questionIdsInBlock = new Set(
                allQuestions.map(question => Number(question.id))
            );

            if (
                questionIds.some(questionId => !questionIdsInBlock.has(questionId))
            ) {
                await connection.rollback();
                return res.status(400).json({
                    error: "Alla valda uppgifter måste tillhöra blocket."
                });
            }

            if (questionIds.length >= allQuestions.length) {
                await connection.rollback();
                return res.status(400).json({
                    error: "Minst en uppgift måste vara kvar i originalblocket."
                });
            }

            const firstMovedQuestion = allQuestions.find(question =>
                questionIds.includes(Number(question.id))
            );

            const [blockResult] = await connection.query(
                `
                INSERT INTO blocks (
                    created_by,
                    updated_by,
                    school_id,
                    visibility,
                    title
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    block.created_by,
                    req.user.id,
                    block.school_id,
                    block.visibility,
                    firstMovedQuestion?.question?.substring(0, 100) || block.title
                ]
            );

            const newBlockId = blockResult.insertId;

            await connection.query(
                `
                INSERT INTO block_points (
                    block_id,
                    central_content_id,
                    competency_descriptor_id,
                    points,
                    comment
                )
                SELECT
                    ?,
                    central_content_id,
                    competency_descriptor_id,
                    points,
                    comment
                FROM block_points
                WHERE block_id = ?
                `,
                [newBlockId, blockId]
            );

            await connection.query(
                `
                INSERT INTO block_sections (
                    block_id,
                    section_id
                )
                SELECT
                    ?,
                    section_id
                FROM block_sections
                WHERE block_id = ?
                `,
                [newBlockId, blockId]
            );

            const [blockAbilities] = await connection.query(
                `
                SELECT ability_id
                FROM block_abilities
                WHERE block_id = ?
                `,
                [blockId]
            );

            for (const blockAbility of blockAbilities) {
                await connection.query(
                    `
                    INSERT INTO block_abilities (
                        block_id,
                        ability_id,
                        progression
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        newBlockId,
                        blockAbility.ability_id,
                        await getNextBlockAbilityProgression(
                            connection,
                            blockAbility.ability_id
                        )
                    ]
                );
            }

            await connection.query(
                `
                INSERT IGNORE INTO block_question_priorities (
                    block_id,
                    question_id
                )
                SELECT
                    ?,
                    question_id
                FROM block_question_priorities
                WHERE block_id = ?
                    AND question_id IN (?)
                `,
                [newBlockId, blockId, questionIds]
            );

            await connection.query(
                `
                DELETE FROM block_question_priorities
                WHERE block_id = ?
                    AND question_id IN (?)
                `,
                [blockId, questionIds]
            );

            await connection.query(
                `
                UPDATE questions
                SET
                    block_id = ?,
                    updated_by = ?
                WHERE block_id = ?
                    AND id IN (?)
                `,
                [newBlockId, req.user.id, blockId, questionIds]
            );

            await connection.query(
                `
                UPDATE blocks
                SET updated_by = ?
                WHERE id IN (?, ?)
                `,
                [req.user.id, blockId, newBlockId]
            );

            await connection.commit();

            res.status(201).json({
                id: newBlockId,
                originalBlockId: blockId
            });

        } catch (error) {

            await connection.rollback();

            console.error(error);

            res.status(500).json({
                error: error.message || "Kunde inte dela blocket."
            });

        } finally {

            connection.release();

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
                    id,
                    content
                FROM central_content
                ORDER BY content
                `
            );

        const [competencyDescriptors] =
            await db.query(
                `
                SELECT
                    cd.id,

                    cd.grade,

                    c.id AS competency_id,
                    c.name AS competency_name,

                    l.id AS level_id,
                    l.name AS level_name

                FROM competency_descriptors cd

                JOIN competencies c
                    ON c.id = cd.competency_id

                JOIN levels l
                    ON l.id = cd.level_id

                ORDER BY
                    c.name,
                    cd.grade
                `
            );

        res.json({
            centralContent,
            competencyDescriptors
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

            const isOwner =
                block.created_by ===
                req.user.id;

            if (!isOwner) {

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

            }

            const canAccess =

                isOwner

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

            const blockTitle = block.title;

            const [blockResult] =
                await connection.query(
                    `
                    INSERT INTO blocks (

                        created_by,
                        updated_by,

                        school_id,

                        visibility,
                        title

                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        req.user.id,
                        req.user.id,
                        schoolId,
                        "private",
                        blockTitle
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
                    competency_descriptor_id,
                    points
                )
                SELECT
                    ?,
                    central_content_id,
                    competency_descriptor_id,
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
            const [blockAbilities] = await connection.query(
                `
                SELECT ability_id
                FROM block_abilities
                WHERE block_id = ?
                `,
                [block.id]
            );

            for (const blockAbility of blockAbilities) {
                await connection.query(
                    `
                    INSERT INTO block_abilities (
                        block_id,
                        ability_id,
                        progression
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        newBlockId,
                        blockAbility.ability_id,
                        await getNextBlockAbilityProgression(
                            connection,
                            blockAbility.ability_id
                        )
                    ]
                );
            }

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
                            series_level_id,

                            created_by,
                            updated_by,

                            answer_config

                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            question.question,
                            newBlockId,
                            question.question_type,
                            question.level_id,
                            question.series_level_id,

                            req.user.id,
                            req.user.id,

                            typeof question.answer_config === "string"
                                ? question.answer_config
                                : JSON.stringify(question.answer_config)
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

// POST   /api/blocks/:id/export
router.post("/:id/export",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            await connection.beginTransaction();

            const { id } = req.params;

            const {
                section_id,
                ability_id,
                export_mode = "link"
            } = req.body;

            if (!section_id || !ability_id) {

                await connection.rollback();

                return res.status(400).json({
                    error:
                        "Välj både avsnitt och förmåga."
                });

            }

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

                await connection.rollback();

                return res.status(404).json({
                    error:
                        "Blocket hittades inte."
                });

            }

            const isOwner =
                block.created_by ===
                req.user.id;

            if (!isOwner && export_mode === "copy") {

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

                    await connection.rollback();

                    return res.status(403).json({
                        error:
                            "Skolan tillåter inte kopiering."
                    });

                }

            }

            const canAccess =

                isOwner

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

                await connection.rollback();

                return res.status(403).json({
                    error:
                        "Du saknar behörighet."
                });

            }

            if (export_mode === "link") {

                await connection.query(
                    `
                    INSERT IGNORE INTO block_sections (
                        block_id,
                        section_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        block.id,
                        section_id
                    ]
                );

                await connection.query(
                    `
                    INSERT IGNORE INTO block_abilities (
                        block_id,
                        ability_id,
                        progression
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        block.id,
                        ability_id,
                        await getNextBlockAbilityProgression(connection, ability_id)
                    ]
                );

                await connection.commit();

                return res.status(200).json({
                    id: block.id,
                    mode: "link"
                });

            }

            const [blockResult] =
                await connection.query(
                    `
                    INSERT INTO blocks (

                        created_by,
                        updated_by,

                        school_id,

                        visibility,
                        title

                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        req.user.id,
                        req.user.id,
                        schoolId,
                        "private",
                        block.title
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
                    competency_descriptor_id,
                    points
                )
                SELECT
                    ?,
                    central_content_id,
                    competency_descriptor_id,
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
             * Koppla till vald sektion och förmåga
             */
            await connection.query(
                `
                INSERT INTO block_sections (
                    block_id,
                    section_id
                )
                VALUES (?, ?)
                `,
                [
                    newBlockId,
                    section_id
                ]
            );

            await connection.query(
                `
                INSERT INTO block_abilities (
                    block_id,
                    ability_id,
                    progression
                )
                VALUES (?, ?, ?)
                `,
                [
                    newBlockId,
                    ability_id,
                    await getNextBlockAbilityProgression(connection, ability_id)
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
                            series_level_id,

                            created_by,
                            updated_by,

                            answer_config

                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            question.question,
                            newBlockId,
                            question.question_type,
                            question.level_id,
                            question.series_level_id,

                            req.user.id,
                            req.user.id,

                            typeof question.answer_config === "string"
                                ? question.answer_config
                                : JSON.stringify(question.answer_config)
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
                id: newBlockId,
                mode: "copy"
            });

        } catch (error) {

            await connection.rollback();

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        } finally {

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
                a.*,
                ba.progression
            FROM abilities a
            JOIN block_abilities ba
                ON ba.ability_id = a.id
            WHERE ba.block_id = ?
            ORDER BY ba.progression, a.name
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
                ability_id,
                progression
            )
            VALUES (?, ?, ?)
            `,
            [
                req.params.id,
                req.params.abilityId,
                await getNextBlockAbilityProgression(db, req.params.abilityId)
            ]
        );

        res.sendStatus(204);

    }
);

//POST /api/blocks/abilities/:abilityId/reorder
router.post("/abilities/:abilityId/reorder",
    async (req, res) => {

        const abilityId = Number(req.params.abilityId);
        const draggedBlockId = Number(req.body?.draggedBlockId);
        const targetBlockId = Number(req.body?.targetBlockId);

        if (
            !Number.isInteger(abilityId) ||
            !Number.isInteger(draggedBlockId) ||
            !Number.isInteger(targetBlockId) ||
            abilityId <= 0 ||
            draggedBlockId <= 0 ||
            targetBlockId <= 0
        ) {
            return res.status(400).json({
                error: "Ogiltig blockordning."
            });
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [blocks] = await connection.query(
                `
                SELECT
                    ba.block_id,
                    ba.progression,
                    b.created_by
                FROM block_abilities ba
                JOIN blocks b
                    ON b.id = ba.block_id
                WHERE ba.ability_id = ?
                    AND b.deleted_at IS NULL
                    AND b.archived_at IS NULL
                ORDER BY ba.progression, ba.block_id
                FOR UPDATE
                `,
                [abilityId]
            );

            const draggedIndex = blocks.findIndex(block =>
                Number(block.block_id) === draggedBlockId
            );
            const targetIndex = blocks.findIndex(block =>
                Number(block.block_id) === targetBlockId
            );

            if (draggedIndex === -1 || targetIndex === -1) {
                await connection.rollback();
                return res.status(404).json({
                    error: "Blocket finns inte i förmågan."
                });
            }

            const draggedBlock = blocks[draggedIndex];
            const canEdit =
                req.user.role === "super" ||
                draggedBlock.created_by === req.user.id;

            if (!canEdit) {
                await connection.rollback();
                return res.status(403).json({
                    error: "Du saknar behörighet att ändra progressionen."
                });
            }

            const reorderedBlocks = [...blocks];
            const [movedBlock] = reorderedBlocks.splice(draggedIndex, 1);
            reorderedBlocks.splice(targetIndex, 0, movedBlock);

            for (let index = 0; index < reorderedBlocks.length; index++) {
                await connection.query(
                    `
                    UPDATE block_abilities
                    SET progression = ?
                    WHERE ability_id = ?
                        AND block_id = ?
                    `,
                    [
                        index + 1,
                        abilityId,
                        reorderedBlocks[index].block_id
                    ]
                );
            }

            await connection.commit();
            res.sendStatus(204);
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({
                error: error.message || "Kunde inte ändra progressionen."
            });
        } finally {
            connection.release();
        }

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

                c.id AS competency_id,
                c.name AS competency_name,

                cd.grade,

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
            competency_descriptor_id,
            points
        } = req.body;

        const [result] = await db.query(
            `
            INSERT INTO block_points (
                block_id,
                central_content_id,
                competency_descriptor_id,
                points
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.params.id,
                central_content_id,
                competency_descriptor_id,
                points
            ]
        );

        res.json({
            id: result.insertId
        });

    }
);

export default router;