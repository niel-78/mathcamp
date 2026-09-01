import XLSX from "xlsx";
import db from "../db.js";

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

    let importedCount = 0;

    for (const row of rows) {

        const question =
            row.Fråga ||
            row.fråga ||
            row.Question ||
            row.question;

        if (!question) {
            continue;
        }

        const questionType =
            row.Frågetyp ||
            row.frågetyp ||
            row.QuestionType ||
            row.questionType ||
            "text";

        const levelNumber =
            Number(
                row.Nivå ||
                row.Level ||
                row.level ||
                1
            );

        const seriesLevelId =
            levels[levelNumber - 1]?.id || null;

        console.log("blockId", blockId);
        console.log("ability", ability);
        console.log("levels", levels);

        const correctAnswers =
            String(
                row["Korrekta alternativ"] ||
                row["Rätta svar"] ||
                ""
            )
                .split(",")
                .map(x => x.trim())
                .filter(Boolean);

        let answerConfig = {};

        if (questionType === "text") {

            answerConfig = {
                correctAnswers
            };

        }

        const [questionResult] =
            await db.query(
                `
                INSERT INTO questions (
                    block_id,
                    question,
                    question_type,
                    series_level_id,
                    created_by,
                    updated_by,
                    answer_config
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    blockId,
                    question,
                    questionType,
                    seriesLevelId,
                    userId,
                    userId,
                    JSON.stringify(answerConfig)
                ]
            );

        const questionId =
            questionResult.insertId;

        if (
            questionType === "single_choice" ||
            questionType === "multiple_choice"
        ) {

            for (let i = 1; i <= 20; i++) {

                const optionText =
                    row[`Alternativ ${i}`];

                if (!optionText) {
                    continue;
                }

                const isCorrect =
                    correctAnswers.includes(
                        String(i)
                    );

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
                        optionText,
                        isCorrect ? 1 : 0,
                        userId,
                        userId
                    ]
                );

            }

        }

        importedCount++;

    }

    return importedCount;
}