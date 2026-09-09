import { compareNumeric } from "./gradeNumeric.js";

// Deduplicates correctAnswer by value (e.g. a double root only needs to be given once) and
// matches studentAnswer against it as a set: every unique correct value must be present among
// the (non-empty) student values, and every student value must be a valid correct value.
const compareUnordered = (studentValues, correctAnswer, config) => {

    const parsedStudent =
        studentValues
            .map(v => (v ?? "").toString().trim())
            .filter(v => v !== "");

    const uniqueCorrect = [];

    for (const correctValue of correctAnswer) {

        const alreadyIncluded =
            uniqueCorrect.some(
                u => compareNumeric(u, correctValue, config)
            );

        if (!alreadyIncluded) {
            uniqueCorrect.push(correctValue);
        }

    }

    const allCorrectMatched =
        uniqueCorrect.every(
            correctValue =>
                parsedStudent.some(
                    s => compareNumeric(s, correctValue, config)
                )
        );

    const allStudentValuesValid =
        parsedStudent.every(
            s =>
                uniqueCorrect.some(
                    correctValue => compareNumeric(s, correctValue, config)
                )
        );

    return allCorrectMatched && allStudentValuesValid;

};

// studentAnswer/correctAnswer are arrays (one numeric value per input field), in field order.
// All-or-nothing: every field must match for the question to count as correct.
// If config.order_independent is set, fields are matched as a set instead of by position (also
// covers e.g. equations with a double root, where only one field needs to hold the root).
export const gradeNumericInput = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    let studentValues = studentAnswer;

    if (typeof studentValues === "string") {

        try {
            studentValues = JSON.parse(studentValues);
        } catch (error) {
            return false;
        }

    }

    if (
        !Array.isArray(studentValues) ||
        !Array.isArray(correctAnswer) ||
        studentValues.length !== correctAnswer.length ||
        correctAnswer.length === 0
    ) {
        return false;
    }

    if (config.order_independent) {
        return compareUnordered(studentValues, correctAnswer, config);
    }

    return correctAnswer.every(
        (correctValue, index) =>
            compareNumeric(
                studentValues[index],
                correctValue,
                config
            )
    );

};

// Counts how many of the input boxes are individually satisfied, treating correctAnswer as a
// multiset (so a double root still counts as 2 slots to fill). Positional match when order
// matters, greedy multiset match (each student value claims at most one correct slot) otherwise.
const countMatches = (studentValues, correctAnswer, config) => {

    if (!config.order_independent) {

        return correctAnswer.filter(
            (correctValue, index) =>
                compareNumeric(studentValues[index], correctValue, config)
        ).length;

    }

    const remaining = [...correctAnswer];
    let matches = 0;

    for (const studentValue of studentValues) {

        if ((studentValue ?? "").toString().trim() === "") {
            continue;
        }

        const matchIndex =
            remaining.findIndex(
                correctValue => compareNumeric(studentValue, correctValue, config)
            );

        if (matchIndex !== -1) {
            remaining.splice(matchIndex, 1);
            matches++;
        }

    }

    return matches;

};

// Partial-credit scoring for a numeric_input question, used for both "poäng" (linear) and
// mastery (harsher) credit when not every box is correct:
// - pointsFraction: correctCount / totalCount (e.g. 1 of 2 right = 0.5, 2 of 3 right = 0.67)
// - masteryMultiplier: (2*correctCount - totalCount) / (totalCount * (totalCount - 1)), so e.g.
//   1 of 2 right = 0 (no mastery change), 2 of 3 right = 1/6 of the normal +/-5 mastery step.
//   Always 1 when the question is fully correct, and falls back to a plain +/-1 for single-box
//   questions (no partial concept possible with just one box).
// Returns one boolean per input box: whether that specific box's value is individually correct.
// Positional check when order matters; when order doesn't matter, each student value greedily
// claims an unclaimed correct slot (so e.g. a double root filled in only one box still marks
// just that one box green, not both).
export const getFieldMatches = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    let studentValues = studentAnswer;

    if (typeof studentValues === "string") {

        try {
            studentValues = JSON.parse(studentValues);
        } catch (error) {
            studentValues = null;
        }

    }

    if (
        !Array.isArray(studentValues) ||
        !Array.isArray(correctAnswer)
    ) {
        return [];
    }

    if (!config.order_independent) {

        return studentValues.map(
            (studentValue, index) =>
                compareNumeric(studentValue, correctAnswer[index], config)
        );

    }

    const remaining =
        correctAnswer.map(value => ({ value, used: false }));

    return studentValues.map(studentValue => {

        if ((studentValue ?? "").toString().trim() === "") {
            return false;
        }

        const slot =
            remaining.find(
                r => !r.used && compareNumeric(studentValue, r.value, config)
            );

        if (!slot) {
            return false;
        }

        slot.used = true;
        return true;

    });

};

export const scoreNumericInput = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    let studentValues = studentAnswer;

    if (typeof studentValues === "string") {

        try {
            studentValues = JSON.parse(studentValues);
        } catch (error) {
            studentValues = null;
        }

    }

    const totalCount =
        Array.isArray(correctAnswer) ? correctAnswer.length : 0;

    if (
        !Array.isArray(studentValues) ||
        !Array.isArray(correctAnswer) ||
        studentValues.length !== correctAnswer.length ||
        totalCount === 0
    ) {
        return {
            correct: false,
            correctCount: 0,
            totalCount,
            pointsFraction: 0,
            masteryMultiplier: -1
        };
    }

    const correct =
        gradeNumericInput(studentAnswer, correctAnswer, config);

    const correctCount =
        countMatches(studentValues, correctAnswer, config);

    const pointsFraction =
        correct ? 1 : correctCount / totalCount;

    const masteryMultiplier =
        correct
            ? 1
            : totalCount <= 1
                ? -1
                : Math.max(
                    -1,
                    (2 * correctCount - totalCount) /
                    (totalCount * (totalCount - 1))
                );

    return {
        correct,
        correctCount,
        totalCount,
        pointsFraction,
        masteryMultiplier
    };

};
