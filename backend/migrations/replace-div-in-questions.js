import "dotenv/config";
import mysql from "mysql2/promise";

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [result] = await connection.query(`
            UPDATE questions
            SET question = REPLACE(question, CONCAT(CHAR(92), 'div'), '/')
            WHERE INSTR(question, CONCAT(CHAR(92), 'div')) > 0
        `);

        console.log(`Replaced \\div in ${result.affectedRows} question(s).`);
    } finally {
        await connection.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});