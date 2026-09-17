import { gradeText } from "./gradeText.js";
import { gradeNumeric } from "./gradeNumeric.js";
import { gradeAlgebra } from "./gradeAlgebra.js";
import { gradeVariables } from "./gradeVariables.js";
import { gradeFraction } from "./gradeFraction.js";
import { gradeNumericInput } from "./gradeNumericInput.js";

export const gradeAnswer = ({
    studentAnswer,
    correctAnswer,
    config = {}
}) => {

    config = config || {};

    const mode =
        config?.grading_mode || "text";

    switch (mode) {

        case "text":
            return gradeText(
                studentAnswer,
                correctAnswer
            );

        case "numeric":
            return gradeNumeric(
                studentAnswer,
                correctAnswer,
                config
            );

        case "numeric_input":
        case "equation":
            return gradeNumericInput(
                studentAnswer,
                correctAnswer,
                config
            );

        case "fraction":
            return gradeFraction(
                studentAnswer,
                correctAnswer,
                config
            );

        case "algebra":
            return gradeAlgebra(
                studentAnswer,
                correctAnswer
            );

        case "variables":
            return gradeVariables(
                studentAnswer,
                correctAnswer,
                config
            );

        default:
            return gradeText(
                studentAnswer,
                correctAnswer
            );
    }
};