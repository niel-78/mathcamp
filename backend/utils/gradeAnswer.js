import { gradeText } from "./gradeText.js";
import { gradeNumeric } from "./gradeNumeric.js";
import { gradeAlgebra } from "./gradeAlgebra.js";
import { gradeVariables } from "./gradeVariables.js";

export const gradeAnswer = ({
    studentAnswer,
    correctAnswer,
    config = {}
}) => {

    console.log(config.grading_mode);

    const mode =
        config.grading_mode || "text";

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