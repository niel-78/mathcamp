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
            CREATE TABLE IF NOT EXISTS assessment_geogebra_constructions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id VARCHAR(36) NOT NULL,
                question_id INT NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT 'Provkonstruktion',
                construction_xml MEDIUMTEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_attempt_question (attempt_id, question_id),
                CONSTRAINT fk_geogebra_construction_attempt
                    FOREIGN KEY (attempt_id)
                    REFERENCES assessment_attempts(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_geogebra_construction_question
                    FOREIGN KEY (question_id)
                    REFERENCES questions(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            `
        );

        try {
            await connection.query(
                `
                ALTER TABLE assessment_geogebra_constructions
                ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Provkonstruktion'
                AFTER question_id
                `
            );
        } catch (error) {
            if (error.code !== "ER_DUP_FIELDNAME") {
                throw error;
            }
        }

        console.log("GeoGebra construction table ready.");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
