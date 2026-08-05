import { normalizeAnswer }
    from "../utils/normalizeAnswer.js";

console.log("-> gradeText");

export const gradeText = (
    studentAnswer,
    correctAnswer
) => {

    return (
        normalizeAnswer(studentAnswer) ===
        normalizeAnswer(correctAnswer)
    );
};