import "dotenv/config";
import db from "../db.js";

try {
    const [sectionColumns] = await db.query(
        `
            SELECT COUNT(*) AS count
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
            AND table_name = 'sections'
            AND column_name = 'planning_priority'
        `
    );

    if (sectionColumns[0].count === 0) {
        await db.query(
            `
                ALTER TABLE sections
                ADD COLUMN planning_priority TINYINT(1) NOT NULL DEFAULT 0
            `
        );
    }

    const [queueColumns] = await db.query(
        `
            SELECT COUNT(*) AS count
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
            AND table_name = 'group_planning_sections'
            AND column_name = 'priority'
        `
    );

    if (queueColumns[0].count === 0) {
        await db.query(
            `
                ALTER TABLE group_planning_sections
                ADD COLUMN priority TINYINT(1) NOT NULL DEFAULT 0
            `
        );
    }

    console.log("Planning queue priority support added.");
} finally {
    await db.end();
}