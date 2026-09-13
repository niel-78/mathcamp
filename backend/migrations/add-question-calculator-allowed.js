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
            ALTER TABLE questions
            ADD COLUMN calculator_allowed TINYINT(1)
                NOT NULL DEFAULT 0
            AFTER deleted_at
            `
        );

        console.log("Question calculator permission column added.");
    } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
            console.log("Question calculator permission column already exists.");
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