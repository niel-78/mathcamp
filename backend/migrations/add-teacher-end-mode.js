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
             ADD COLUMN teacher_end_mode ENUM('soft', 'hard') NULL`
        );
        console.log("Teacher end mode column added successfully");
    } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
            console.log("Teacher end mode column already exists");
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