import XLSX from "xlsx";
import db from "../db.js";
import { normalizeImportRows } from "./normalizeImportRows.js";

export default async function importQuestionsToBlock({
    blockId,
    fileBuffer,
    userId
}) {

    const workbook = XLSX.read(fileBuffer);

    const sheet =
        workbook.Sheets[
            workbook.SheetNames[0]
        ];

    const rows =
        XLSX.utils.sheet_to_json(sheet);

    const [[ability]] =
        await db.query(
            `
            SELECT a.series_id
            FROM abilities a
            INNER JOIN block_abilities ba
                ON ba.ability_id = a.id
            WHERE ba.block_id = ?
            LIMIT 1
            `,
            [blockId]
        );

    let levels = [];

    if (ability) {

        [levels] = await db.query(
            `
            SELECT id
            FROM ability_series_levels
            WHERE series_id = ?
            ORDER BY sort_order
            `,
            [ability.series_id]
        );

    }

    // The generic level (Repetition/Grundläggande/...) is tied to the question
    // itself and is set regardless of whether the block has an ability.
    const [questionLevels] = await db.query(
        `
        SELECT id
        FROM question_levels
        ORDER BY sort_order
        `
    );

    const { questions } = normalizeImportRows({
        rows,
        blockId,
        userId,
        abilityLevels: levels,
        questionLevels
    });

    for (const question of questions) {

        const [questionResult] =
            await db.query(
                `
                INSERT INTO questions (
                    block_id,
                    question,
                    question_type,
                    series_level_id,
                    level_id,
                    calculator_allowed,
                    geogebra_allowed,
                    created_by,
                    updated_by,
                    answer_config
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    blockId,
                    question.question,
                    question.questionType,
                    question.seriesLevelId,
                    question.levelId,
                    question.calculatorAllowed ? 1 : 0,
                    question.geogebraAllowed ? 1 : 0,
                    userId,
                    userId,
                    JSON.stringify(question.answerConfig)
                ]
            );

        const questionId =
            questionResult.insertId;

        for (const option of question.options) {
            await db.query(
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
                    questionId,
                    option.text,
                    option.isCorrect,
                    userId,
                    userId
                ]
            );
        }

        if (question.imageUrl) {
            await db.query(
                `
                INSERT INTO question_media (
                    question_id,
                    media_type,
                    media_url,
                    sort_order
                )
                VALUES (?, 'image', ?, 0)
                `,
                [questionId, question.imageUrl]
            );
        }

    }

    return questions.length;
}