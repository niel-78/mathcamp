import "dotenv/config";
import mysql from "mysql2/promise";

function cleanNumericInputMarkers(text) {
    const cleanText = String(text || "").trim();
    const lines = cleanText.split("\n");

    while (lines.length > 0) {
        const lastLine = lines[lines.length - 1].trim();
        if (
            lastLine === "{{input}}" ||
            /^(?:svar:\s*)?(?:[a-zA-Z](?:_\d+)?\s*=\s*)?\{\{input\}\}\s*$/i.test(lastLine)
        ) {
            lines.pop();
        } else {
            break;
        }
    }

    return lines
        .join("\n")
        .replace(/\s*Skriv\s+[^.!?\n]*\{\{input\}\}[^.!?\n]*[.!?]?/gi, "")
        .replace(/\s*(?:Svar|Svara)\s*:\s*\{\{input\}\}\s*[.!?]?/gi, "")
        .replace(/\{\{input\}\}/g, "")
        .replace(/\s+([,.!?])/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [questions] = await connection.query(
            `
            SELECT id, question
            FROM questions
            WHERE question_type = 'numeric_input'
              AND question LIKE '%{{input}}%'
            `
        );

        let updatedCount = 0;

        for (const question of questions) {
            const cleanedQuestion = cleanNumericInputMarkers(question.question);

            if (cleanedQuestion !== question.question) {
                await connection.query(
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

        console.log(`Removed numeric input markers from ${updatedCount} questions.`);
    } finally {
        await connection.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});