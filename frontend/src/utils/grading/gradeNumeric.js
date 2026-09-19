export const isAnswerFormatAllowed = (value, answerFormat = "all") => {
    if (answerFormat === "all") return true;

    const normalized = String(value ?? "").trim();
    if (answerFormat === "percent") {
        return /^[-+]?\d+(?:[.,]\d+)?%$/.test(normalized);
    }
    if (answerFormat === "fraction") {
        return /^[-+]?\d+\s*\/\s*[-+]?\d+$/.test(normalized) ||
            /^[-+]?\\frac\{[-+]?\d+\}\{[-+]?\d+\}$/.test(normalized);
    }
    if (answerFormat === "decimal") {
        return /^[-+]?\d+(?:[.,]\d+)?$/.test(normalized);
    }

    return false;
};

// Accepts decimal point/comma, fractions and percentages (e.g. 50% = 0.5).
export const parseNumericAnswer = (value, config = {}) => {

    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return NaN;
    }

    let raw = String(value).trim();

    const equationAnswer = /^x\s*=\s*([-+]?\d+(?:[.,]\d+)?)$/i.exec(raw);
    if (equationAnswer) {
        raw = equationAnswer[1];
    }

    const isPercent = raw.endsWith("%");
    const normalized =
        raw.replace(/%$/, "")
            .replace(",", ".");

    const latexFraction = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(normalized);
    if (latexFraction) {
        const result = (latexFraction[1] ? -1 : 1) *
            Number(latexFraction[2]) /
            Number(latexFraction[3]);
        return isPercent ? result / 100 : result;
    }

    const slashFraction = /^(-?\d+)\/(\d+)$/.exec(normalized);
    if (slashFraction) {
        const result = Number(slashFraction[1]) / Number(slashFraction[2]);
        return isPercent ? result / 100 : result;
    }

    const result = Number(normalized);
    return isPercent ? result / 100 : result;
};

export const compareNumeric = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    if (!isAnswerFormatAllowed(studentAnswer, config.answer_format ?? "all")) {
        return false;
    }

    const student =
        parseNumericAnswer(studentAnswer, config);

    const correct =
        parseNumericAnswer(correctAnswer, config);

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