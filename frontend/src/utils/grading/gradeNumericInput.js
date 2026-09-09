import { compareNumeric } from "./gradeNumeric.js";

// studentAnswer/correctAnswer are arrays (one numeric value per input field), in field order.
// All-or-nothing: every field must match for the question to count as correct.
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

    return correctAnswer.every(
        (correctValue, index) =>
            compareNumeric(
                studentValues[index],
                correctValue,
                config
            )
    );

};
