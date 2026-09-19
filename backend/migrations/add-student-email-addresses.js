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

        const [result] = await connection.query(
            `
            UPDATE users
            SET email = CONCAT(username, '@elev.ga.dbgy.se')
            WHERE role = 'student'
                AND (email IS NULL OR email = '')
            `
        );

        console.log(`Student email addresses updated: ${result.affectedRows}`);
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});