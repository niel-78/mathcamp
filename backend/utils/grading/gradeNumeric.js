// Accepts both "." and "," as decimal separator (e.g. "3,5" and "3.5" are equivalent)
export const parseNumericAnswer = (value) => {

    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return NaN;
    }

    const normalized =
        String(value)
            .trim()
            .replace(",", ".");

    return Number(normalized);
};

export const compareNumeric = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    const student =
        parseNumericAnswer(studentAnswer);

    const correct =
        parseNumericAnswer(correctAnswer);

    if (
        Number.isNaN(student) ||
        Number.isNaN(correct)
    ) {
        return false;
    }

    if (
        config.tolerance !== undefined &&
        config.tolerance !== ""
    ) {

        const result =
            Math.abs(
                student - correct
            ) <= config.tolerance;

        return result;
    }


    if (
        config.round_to !== undefined &&
        config.round_to !== ""
    ) {

        const roundedStudent =
            Math.round(
                student / config.round_to
            ) * config.round_to;

        const roundedCorrect =
            Math.round(
                correct / config.round_to
            ) * config.round_to;

        const result =
            roundedStudent ===
            roundedCorrect;

        return result;
    }


    if (
        config.decimals !== undefined &&
        config.decimals !== ""
    ) {

        const result =
            student.toFixed(
                config.decimals
            ) ===
            correct.toFixed(
                config.decimals
            );

        return result;
    }

    return student === correct;
};

export const gradeNumeric = (
    studentAnswer,
    correctAnswer,
    config = {}
) => compareNumeric(studentAnswer, correctAnswer, config);