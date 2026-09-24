import db from "../db.js";
import { solveLinearSystem } from "../utils/autoFixQuestion.js";

async function migrateExistingLinearSystems() {
    const [questions] = await db.query(`
        SELECT id, question, answer_config
        FROM questions
        WHERE question_type = 'numeric_input'
          AND question LIKE '%ekvationssystem%'
          AND deleted_at IS NULL
          AND archived_at IS NULL
    `);

    let migrated = 0;
    const equalSolutions = [];

    for (const question of questions) {
        const answers = solveLinearSystem(question.question);
        if (!answers || answers.length !== 2) continue;

        if (answers[0].toKey() === answers[1].toKey()) {
            equalSolutions.push(question.id);
            continue;
        }

        let config = {};
        try {
            config = typeof question.answer_config === "string"
                ? JSON.parse(question.answer_config || "{}")
                : question.answer_config || {};
        } catch {
            config = {};
        }

        config.variables = [
            { name: "x", answer: answers[0].toDisplay() },
            { name: "y", answer: answers[1].toDisplay() }
        ];
        config.require_distinct_values = true;
        config.order_independent = false;

        await db.query(
            `
            UPDATE questions
            SET question_type = 'linear_system',
                answer_config = ?,
                updated_at = NOW()
            WHERE id = ?
            `,
            [JSON.stringify(config), question.id]
        );
        migrated++;
    }

    console.log(JSON.stringify({ migrated, equalSolutions }));
    process.exit(0);
}

migrateExistingLinearSystems().catch(error => {
    console.error(error);
    process.exit(1);
});
