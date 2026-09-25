import db from "../db.js";

try {
    await db.query(`
        CREATE TABLE IF NOT EXISTS user_session_events (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            session_id BIGINT NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            event_data JSON NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX(session_id),
            FOREIGN KEY (session_id)
                REFERENCES user_sessions(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
    `);

    console.log("user_session_events table is ready.");
} catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
} finally {
    await db.end();
}
