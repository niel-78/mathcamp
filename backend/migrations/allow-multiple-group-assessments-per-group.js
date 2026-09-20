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

        const [indexes] = await connection.query(
            `
            SELECT DISTINCT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'group_assessments'
                AND NON_UNIQUE = 0
                AND INDEX_NAME <> 'PRIMARY'
                AND COLUMN_NAME IN ('group_id', 'assessment_id')
            `
        );

        for (const { INDEX_NAME: indexName } of indexes) {
            const [columns] = await connection.query(
                `
                SELECT COLUMN_NAME
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'group_assessments'
                    AND INDEX_NAME = ?
                ORDER BY SEQ_IN_INDEX
                `,
                [indexName]
            );

            if (
                columns.length === 2 &&
                columns[0].COLUMN_NAME === "group_id" &&
                columns[1].COLUMN_NAME === "assessment_id"
            ) {
                await connection.query(
                    `ALTER TABLE group_assessments DROP INDEX \`${indexName}\``
                );
                console.log(`Dropped unique index ${indexName}.`);
            }
        }
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});