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
            CREATE TABLE IF NOT EXISTS group_question_priorities (
                group_id INT NOT NULL,

                question_id INT NOT NULL,

                created_at DATETIME NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (
                    group_id,
                    question_id
                ),

                CONSTRAINT fk_group_question_priorities_group
                    FOREIGN KEY (group_id)
                    REFERENCES \`groups\`(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_group_question_priorities_question
                    FOREIGN KEY (question_id)
                    REFERENCES questions(id)
                    ON DELETE CASCADE
            )
            `
        );

        console.log("group_question_priorities table created (or already existed).");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
