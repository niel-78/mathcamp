import "dotenv/config";
import mysql from "mysql2/promise";

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await connection.query(
            `ALTER TABLE assessment_attempts
             ADD COLUMN current_question_index INT NOT NULL DEFAULT 0`
        );
        console.log("current_question_index column added successfully");
    } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
            console.log("current_question_index column already exists");
        } else {
            throw error;
        }
    } finally {
        await connection.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
});
