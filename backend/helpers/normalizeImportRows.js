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

    if (questionType === "linear_system") {
        if (correctAnswers.length !== 2) {
            errors.push("linear_system måste ha exakt två svar, ett för x och ett för y");
        } else if (correctAnswers[0] === correctAnswers[1]) {
            errors.push("linear_system måste ha olika värden för x och y");
        }
    }

    if (
        questionType === "numeric_input" ||
        questionType === "equation" ||
        questionType === "linear_system" ||
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

function parseCorrectAnswers(value, questionType) {
    // Choice types accept both separators: a plain "," list like "4,5" can be
    // misread as the number 45 when a CSV round-trips through XLSX parsing.
    const delimiter =
        questionType === "numeric_input" ||
        questionType === "equation" ||
        questionType === "text"
            ? ";"
            : /[,;]/;

    return String(value ?? "")
        .split(delimiter)
        .map(answer => answer.trim())
        .filter(Boolean);
}

function isNumericAnswer(value) {
    return /^-?\d+(?:[,.]\d+)?$/.test(String(value ?? "").trim());
}

export function normalizeImportRows({
    rows,
    blockId,
    userId,
    abilityLevels = [],
    questionLevels = []
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

        let questionType =
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
        const levelId = questionLevels[levelNumber - 1]?.id || null;

        const calculatorAllowed = parseBoolean(
            row["Miniräknare tillåten"] ??
            row["Miniräknare"] ??
            row.calculator_allowed
        );

        const geogebraAllowed = parseBoolean(
            row["GeoGebra tillåten"] ??
            row["GeoGebra"] ??
            row.geogebra_allowed ??
            row["GeoGebra CAS tillåten"]
        );

        const orderIndependent = parseBoolean(
            row["Ordning spelar ingen roll"] ??
            row.order_independent
        );

        const imageUrl = String(
            row["Bild (URL)"] ??
            row["Bild"] ??
            row["Bild URL"] ??
            row.image_url ??
            ""
        ).trim();

        const correctAnswers = parseCorrectAnswers(
            row["Korrekta alternativ"] ??
            row["Rätta svar"] ??
            row["Svar"] ??
            row.svar ??
            row.Answer ??
            row.answer ??
            "",
            questionType
        );

        if (
            questionType === "text" &&
            String(question).includes("{{input}}") &&
            correctAnswers.length > 0 &&
            correctAnswers.every(isNumericAnswer)
        ) {
            questionType = "numeric_input";
        }

        let answerConfig = {};

        if (questionType === "text") {
            answerConfig = { correctAnswers };
        }

        if (
            questionType === "numeric_input" ||
            questionType === "equation" ||
            questionType === "linear_system"
        ) {
            const variableNames = (String(question).match(/([a-zA-Z])\s*=\s*\{\{input\}\}/g) || [])
                .map(match => match.match(/([a-zA-Z])/)[1]);

            answerConfig = {
                grading_mode: "numeric_input",
                default_answer: correctAnswers[0] || "",
                order_independent: questionType === "equation" || orderIndependent,
                ...(questionType === "linear_system"
                    ? {
                        variables: (variableNames.length > 0 ? variableNames : ["x", "y"])
                            .map((name, index) => ({ name, answer: correctAnswers[index] || "" })),
                        require_distinct_values: true
                    }
                    : {})
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

        if (questionType === "text") {
            for (const correctAnswer of correctAnswers) {
                options.push({
                    text: correctAnswer,
                    isCorrect: 1
                });
            }
        }

        if (
            questionType === "numeric_input" ||
            questionType === "equation" ||
            questionType === "linear_system"
        ) {
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
            levelId,
            calculatorAllowed,
            geogebraAllowed,
            imageUrl,
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
