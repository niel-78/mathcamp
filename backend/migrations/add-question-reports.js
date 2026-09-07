import "dotenv/config";
import mysql from "mysql2/promise";

async function migrate() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await connection.query(
            `
            CREATE TABLE question_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id VARCHAR(36) NOT NULL,
                question_id INT NOT NULL,
                user_id INT NOT NULL,
                report_type ENUM('missing_correct_option') NOT NULL,
                comment TEXT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (attempt_id, question_id, report_type),
                INDEX (question_id),
                FOREIGN KEY (attempt_id)
                    REFERENCES assessment_attempts(id)
                    ON DELETE CASCADE,
                FOREIGN KEY (question_id)
                    REFERENCES questions(id),
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
            )
            `
        );

        console.log("Question reports table added.");
    } catch (error) {
        if (error.code === "ER_TABLE_EXISTS_ERROR") {
            console.log("Question reports table already exists.");
        } else {
            throw error;
        }
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});