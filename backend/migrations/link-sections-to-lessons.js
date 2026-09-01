import "dotenv/config";
import mysql from "mysql2/promise";

async function linkSectionsToLessons() {
    try {
        console.log("Connecting to database...");
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // Get the group's book_id
        const [[group]] = await connection.query(
            `SELECT book_id FROM \`groups\` WHERE id = 1`
        );
        
        if (!group?.book_id) {
            console.log("✗ Group 1 has no book_id");
            await connection.end();
            process.exit(1);
        }
        
        console.log(`✓ Group 1 has book_id: ${group.book_id}`);
        
        // Get all sections from that book (through subchapters -> chapters)
        const [sections] = await connection.query(
            `SELECT DISTINCT s.id 
             FROM \`sections\` s
             INNER JOIN \`subchapters\` sub ON sub.id = s.subchapter_id
             INNER JOIN \`chapters\` ch ON ch.id = sub.chapter_id
             WHERE ch.book_id = ?`,
            [group.book_id]
        );
        
        console.log(`✓ Found ${sections.length} sections`);
        
        // Get all lessons that need sections linked
        const [lessons] = await connection.query(
            `SELECT id FROM \`lessons\` WHERE id IN (2, 3, 4, 5, 6)`
        );
        
        console.log(`✓ Found ${lessons.length} lessons to update`);
        
        // Link each section to each lesson
        let insertCount = 0;
        for (const lesson of lessons) {
            for (const section of sections) {
                try {
                    await connection.query(
                        `INSERT IGNORE INTO \`lesson_sections\` (lesson_id, section_id) VALUES (?, ?)`,
                        [lesson.id, section.id]
                    );
                    insertCount++;
                } catch (err) {
                    if (err.code !== 'ER_DUP_ENTRY') {
                        throw err;
                    }
                }
            }
        }
        
        console.log(`✓ Linked ${insertCount} lesson-section pairs`);
        
        await connection.end();
        console.log("\n✓ All sections linked to lessons");
        process.exit(0);
    } catch (error) {
        console.error("✗ Error:", error.message);
        process.exit(1);
    }
}

linkSectionsToLessons();
