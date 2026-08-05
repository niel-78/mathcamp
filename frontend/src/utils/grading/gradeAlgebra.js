import { simplify } from "mathjs";

export const gradeAlgebra = (
    studentAnswer,
    correctAnswer
) => {

    console.log("-> gradeAlgebra");

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