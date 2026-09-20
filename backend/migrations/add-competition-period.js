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
            ALTER TABLE competitions
            ADD COLUMN competition_start_date DATETIME NULL
                AFTER description,
            ADD COLUMN competition_end_date DATETIME NULL
                AFTER competition_start_date
        `);

        await connection.query(`
            UPDATE competitions
            SET competition_start_date = start_date,
                competition_end_date = end_date
            WHERE competition_start_date IS NULL
                AND start_date IS NOT NULL
                AND end_date IS NOT NULL
        `);

        console.log("Competition period columns added.");
    } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
            console.log("Competition period columns already exist.");
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
