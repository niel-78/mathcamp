import db from "../db.js";

async function addFactorizationQuestionType() {
    await db.query(`
        ALTER TABLE questions
        MODIFY COLUMN question_type ENUM(
            'expression',
            'text',
            'single_choice',
            'multiple_choice',
            'numeric_input',
            'equation',
            'linear_system',
            'factorization'
        )
    `);

    console.log("Factorization question type added successfully");
    await db.end();
}

addFactorizationQuestionType().catch(error => {
    console.error(error);
    process.exitCode = 1;
});