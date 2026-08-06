import { normalizeAnswer }
    from "@/utils/normalizeAnswer.js";

export const gradeText = (
    studentAnswer,
    correctAnswer
) => {

    return (
        normalizeAnswer(studentAnswer) ===
        normalizeAnswer(correctAnswer)
    );
};