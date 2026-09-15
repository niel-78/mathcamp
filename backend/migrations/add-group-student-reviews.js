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

        try {
            await connection.query(
                `
                ALTER TABLE group_students
                ADD COLUMN review_status ENUM('green', 'yellow', 'red')
                    NOT NULL DEFAULT 'green',
                ADD COLUMN review_updated_at DATETIME NULL,
                ADD COLUMN review_updated_by INT NULL
                `
            );
        } catch (error) {
            if (error.code !== "ER_DUP_FIELDNAME") {
                throw error;
            }
        }

        await connection.query(
            `
            CREATE TABLE IF NOT EXISTS group_student_review_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                group_id INT NOT NULL,
                previous_status ENUM('green', 'yellow', 'red') NULL,
                new_status ENUM('green', 'yellow', 'red') NOT NULL,
                changed_by INT NOT NULL,
                changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_review_history_group_student (group_id, user_id, changed_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
                FOREIGN KEY (changed_by) REFERENCES users(id)
            ) ENGINE=InnoDB
            `
        );

        console.log("Group student review fields and history table ready.");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
