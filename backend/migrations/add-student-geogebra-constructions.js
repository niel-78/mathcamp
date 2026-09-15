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
            CREATE TABLE IF NOT EXISTS student_geogebra_constructions (
                user_id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL DEFAULT 'Min GeoGebra-konstruktion',
                construction_xml MEDIUMTEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_student_geogebra_user
                    FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
            `
        );

        try {
            await connection.query(
                `
                ALTER TABLE student_geogebra_constructions
                ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Min GeoGebra-konstruktion'
                AFTER user_id
                `
            );
        } catch (error) {
            if (error.code !== "ER_DUP_FIELDNAME") {
                throw error;
            }
        }

        console.log("Student GeoGebra construction table ready.");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
