import { simplify } from "mathjs";

export const gradeAlgebra = (
    studentAnswer,
    correctAnswer
) => {

    try {

        return (
            simplify(
                `(${studentAnswer}) - (${correctAnswer})`
            ).toString() === "0"
        );

    } catch {

        return false;
    }
};