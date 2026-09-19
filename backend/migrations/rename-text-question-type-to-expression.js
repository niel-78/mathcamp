import db from "../db.js";

async function renameTextQuestionType() {
    await db.query(`
        ALTER TABLE questions
        MODIFY COLUMN question_type ENUM(
            'expression',
            'text',
            'single_choice',
            'multiple_choice',
            'numeric_input',
            'equation'
        )
    `);

    await db.query(`
        UPDATE questions
        SET question_type = 'expression'
        WHERE question_type = 'text'
    `);

    console.log("Existing text question types renamed to expression");
    process.exit(0);
}

renameTextQuestionType().catch(error => {
    console.error(error);
    process.exit(1);
});