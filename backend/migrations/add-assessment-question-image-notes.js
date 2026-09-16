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

        await connection.query(`
            CREATE TABLE IF NOT EXISTS assessment_question_image_notes (
                attempt_id VARCHAR(36) NOT NULL,
                question_id INT NOT NULL,
                media_id INT NOT NULL,
                notes_data MEDIUMTEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (attempt_id, media_id),
                CONSTRAINT fk_question_image_notes_attempt
                    FOREIGN KEY (attempt_id)
                    REFERENCES assessment_attempts(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_question_image_notes_question
                    FOREIGN KEY (question_id)
                    REFERENCES questions(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_question_image_notes_media
                    FOREIGN KEY (media_id)
                    REFERENCES question_media(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `);

        console.log("Assessment question image notes table ready.");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});