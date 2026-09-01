import "dotenv/config";
import mysql from "mysql2/promise";

async function populateTitles() {
    try {
        console.log("Connecting to database...");
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log("Populating block titles from first question...");
        
        // Get all blocks with NULL title that have questions
        const [blocksToUpdate] = await connection.query(
            `
            SELECT DISTINCT
                b.id,
                (SELECT question FROM questions 
                 WHERE block_id = b.id 
                 AND deleted_at IS NULL
                 AND archived_at IS NULL
                 ORDER BY id LIMIT 1) AS first_question
            FROM blocks b
            WHERE b.title IS NULL
            AND EXISTS (
                SELECT 1 FROM questions q
                WHERE q.block_id = b.id
                AND q.deleted_at IS NULL
                AND q.archived_at IS NULL
            )
            `
        );
        
        console.log(`Found ${blocksToUpdate.length} blocks with NULL title and questions`);
        
        for (const block of blocksToUpdate) {
            if (block.first_question) {
                // Use first 100 chars of the question as title
                const title = block.first_question.substring(0, 100);
                
                await connection.query(
                    `UPDATE blocks SET title = ? WHERE id = ?`,
                    [title, block.id]
                );
                
                console.log(`✓ Block ${block.id}: "${title.substring(0, 50)}..."`);
            }
        }
        
        // For blocks with no questions, just give them a generic title
        const [emptyBlocks] = await connection.query(
            `
            SELECT id FROM blocks
            WHERE title IS NULL
            `
        );
        
        console.log(`\nFound ${emptyBlocks.length} blocks still with NULL title`);
        
        for (let i = 0; i < emptyBlocks.length; i++) {
            const block = emptyBlocks[i];
            await connection.query(
                `UPDATE blocks SET title = ? WHERE id = ?`,
                [`Block ${block.id}`, block.id]
            );
            console.log(`✓ Block ${block.id}: "Block ${block.id}"`);
        }
        
        await connection.end();
        console.log("\n✓ All blocks now have titles");
        process.exit(0);
    } catch (error) {
        console.error("✗ Migration failed:", error.message);
        process.exit(1);
    }
}

populateTitles();
