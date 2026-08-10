import { normalizeAnswer }
    from "../normalizeAnswer.js";


export const gradeText = (
    studentAnswer,
    correctAnswer
) => {

    return (
        normalizeAnswer(studentAnswer) ===
        normalizeAnswer(correctAnswer)
    );
};