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

        const [abilityColumns] = await connection.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
                AND table_name = 'block_abilities'
                AND column_name IN ('priority', 'progression')
        `);

        const abilityColumnNames = new Set(
            abilityColumns.map(column => column.column_name)
        );

        if (
            !abilityColumnNames.has("progression") &&
            abilityColumnNames.has("priority")
        ) {
            await connection.query(`
                ALTER TABLE block_abilities
                CHANGE COLUMN priority progression INT NOT NULL DEFAULT 1
            `);
        } else if (!abilityColumnNames.has("progression")) {
            await connection.query(`
                ALTER TABLE block_abilities
                ADD COLUMN progression INT NOT NULL DEFAULT 1
                    AFTER ability_id
            `);
        } else if (abilityColumnNames.has("priority")) {
            await connection.query(`
                ALTER TABLE block_abilities
                DROP COLUMN priority
            `);
        }

        await connection.query(`
            UPDATE block_abilities ba
            JOIN (
                SELECT
                    ba_inner.block_id,
                    ba_inner.ability_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY ba_inner.ability_id
                        ORDER BY ba_inner.block_id
                    ) AS next_progression
                FROM block_abilities ba_inner
                JOIN blocks b
                    ON b.id = ba_inner.block_id
                WHERE b.archived_at IS NULL
                    AND b.deleted_at IS NULL
            ) ordered_abilities
                ON ordered_abilities.block_id = ba.block_id
                AND ordered_abilities.ability_id = ba.ability_id
            SET ba.progression = ordered_abilities.next_progression
        `);

        const [blockColumns] = await connection.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
                AND table_name = 'blocks'
                AND column_name IN ('priority', 'progression')
        `);

        for (const column of blockColumns) {
            await connection.query(`
                ALTER TABLE blocks
                DROP COLUMN ${column.column_name}
            `);
        }

        console.log("Block ability progressions added.");
    } finally {
        await connection?.end();
    }
}

migrate().catch(error => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});