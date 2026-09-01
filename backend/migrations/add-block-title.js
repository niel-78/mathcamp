import "dotenv/config";
import mysql from "mysql2/promise";

async function migrate() {
    try {
        console.log("Connecting to database at:", process.env.DB_HOST);
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log("Adding title column to blocks table...");
        
        try {
            await connection.query(
                `ALTER TABLE blocks ADD COLUMN title VARCHAR(255) AFTER school_id`
            );
            console.log("✓ Title column added successfully");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("✓ Title column already exists");
            } else {
                throw error;
            }
        }
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("✗ Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
