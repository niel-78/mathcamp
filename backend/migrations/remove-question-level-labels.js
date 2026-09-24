import "dotenv/config";
import db from "../db.js";

function removeQuestionLevelLabels(text) {
    return String(text || "")
        .replace(/\(\s*Nivå\s+[12]\s*\)\s*/giu, "")
        .replace(/\bNivå\s+[12]\b\s*[:.-]?\s*/giu, "")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

try {
    const [questions] = await db.query(
        `
            SELECT id, question
            FROM questions
        `
    );

    let updatedCount = 0;

    for (const question of questions) {
        const cleanedQuestion = removeQuestionLevelLabels(question.question);

        if (cleanedQuestion !== question.question) {
            await db.query(
                `
                    UPDATE questions
                    SET question = ?, updated_at = NOW()
                    WHERE id = ?
                `,
                [cleanedQuestion, question.id]
            );
            updatedCount++;
        }
    }

    console.log(`Removed question level labels from ${updatedCount} question(s).`);
} finally {
    await db.end();
}