import db from "../db.js";

async function addEquationQuestionType() {
    await db.query(`
        ALTER TABLE questions
        MODIFY COLUMN question_type ENUM(
            'text',
            'single_choice',
            'multiple_choice',
            'numeric_input',
            'equation'
        )
    `);

    console.log("Equation question type added successfully");
    process.exit(0);
}

addEquationQuestionType().catch(error => {
    console.error(error);
    process.exit(1);
});