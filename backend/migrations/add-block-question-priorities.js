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
            CREATE TABLE IF NOT EXISTS block_question_priorities (
                block_id INT NOT NULL,
                question_id INT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (block_id, question_id),
                FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);

        const [columns] = await connection.query(`
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
                AND table_name = 'group_question_priorities'
                AND column_name = 'priority'
        `);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE group_question_priorities
                ADD COLUMN priority TINYINT(1) NOT NULL DEFAULT 1
                    AFTER question_id
            `);
        }

        console.log("Block- and group-level question priorities are ready.");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});