import db from "../db.js";

async function addLinearSystemQuestionType() {
    await db.query(`
        ALTER TABLE questions
        MODIFY COLUMN question_type ENUM(
            'expression',
            'text',
            'single_choice',
            'multiple_choice',
            'numeric_input',
            'equation',
            'linear_system'
        )
    `);

    console.log("Linear system question type added successfully");
    process.exit(0);
}

addLinearSystemQuestionType().catch(error => {
    console.error(error);
    process.exit(1);
});
