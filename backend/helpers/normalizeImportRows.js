export function normalizeImportRows({
    rows,
    blockId,
    userId,
    abilityLevels = []
}) {
    const questions = [];

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

        const levelNumber = Number(
            row.Nivå ||
            row.Level ||
            row.level ||
            1
        );

        const seriesLevelId = abilityLevels[levelNumber - 1]?.id || null;

        const correctAnswers = String(
            row["Korrekta alternativ"] ||
            row["Rätta svar"] ||
            ""
        )
            .split(",")
            .map(value => value.trim())
            .filter(Boolean);

        let answerConfig = {};

        if (questionType === "text") {
            answerConfig = { correctAnswers };
        }

        if (questionType === "numeric_input") {
            answerConfig = {
                grading_mode: "numeric_input",
                default_answer: correctAnswers[0] || ""
            };
        }

        const options = [];

        if (
            questionType === "single_choice" ||
            questionType === "multiple_choice"
        ) {
            for (let i = 1; i <= 20; i++) {
                const optionText = row[`Alternativ ${i}`];

                if (!optionText) {
                    continue;
                }

                options.push({
                    text: optionText,
                    isCorrect: correctAnswers.includes(String(i)) ? 1 : 0
                });
            }
        }

        if (questionType === "numeric_input") {
            for (const correctAnswer of correctAnswers) {
                options.push({
                    text: correctAnswer,
                    isCorrect: 1
                });
            }
        }

        questions.push({
            blockId,
            question,
            questionType,
            seriesLevelId,
            userId,
            answerConfig,
            options
        });
    }

    return { questions };
}
