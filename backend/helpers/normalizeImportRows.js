function validateImportQuestion({
    questionType,
    correctAnswers,
    options,
    rowNumber
}) {
    const errors = [];
    const correctOptionNumbers = correctAnswers.map(Number);

    if (questionType === "single_choice") {
        if (correctAnswers.length !== 1) {
            errors.push("single_choice måste ha exakt ett korrekt alternativ");
        }
    }

    if (questionType === "multiple_choice" && correctAnswers.length === 0) {
        errors.push("multiple_choice måste ha minst ett korrekt alternativ");
    }

    if (
        questionType === "numeric_input" ||
        questionType === "text"
    ) {
        if (correctAnswers.length === 0) {
            errors.push(`${questionType} måste ha minst ett korrekt svar`);
        }
    }

    if (
        questionType === "single_choice" ||
        questionType === "multiple_choice"
    ) {
        if (options.length === 0) {
            errors.push("måste ha minst ett svarsalternativ");
        }

        for (const optionNumber of correctOptionNumbers) {
            if (
                !Number.isInteger(optionNumber) ||
                optionNumber < 1 ||
                !options.some(option => option.number === optionNumber)
            ) {
                errors.push(
                    `korrekt alternativ ${optionNumber || "(tomt)"} saknas`
                );
            }
        }
    }

    return errors.map(error => `Rad ${rowNumber}: ${error}`);
}

function parseBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }

    return ["1", "true", "ja", "yes", "y"].includes(
        String(value ?? "").trim().toLowerCase()
    );
}

export function normalizeImportRows({
    rows,
    blockId,
    userId,
    abilityLevels = []
}) {
    const questions = [];
    const validationErrors = [];

    for (const [index, row] of rows.entries()) {
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

        const calculatorAllowed = parseBoolean(
            row["Miniräknare tillåten"] ??
            row["Miniräknare"] ??
            row.calculator_allowed
        );

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
                    number: i,
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

        validationErrors.push(
            ...validateImportQuestion({
                questionType,
                correctAnswers,
                options,
                rowNumber: index + 2
            })
        );

        questions.push({
            blockId,
            question,
            questionType,
            seriesLevelId,
            calculatorAllowed,
            userId,
            answerConfig,
            options
        });
    }

    if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
    }

    return { questions };
}
