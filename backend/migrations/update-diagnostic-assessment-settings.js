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

        console.log("Updating diagnostic assessment_type_settings with new defaults...");

        const [[row]] = await connection.query(
            `SELECT config FROM assessment_type_settings WHERE assessment_type = 'diagnostic'`
        );

        let config = {};
        if (row?.config) {
            config = typeof row.config === "string" ? JSON.parse(row.config) : row.config;
        }

        config.attempt = {
            defaultTimeLimitMinutes: 60,
            countdownMode: "visible_lock",
            minQuestionCount: 5,
            maxQuestionCount: 15,
            promoteAfterQuestions: 1,
            demoteAfterQuestions: 1,
            questionsPerAbility: 1,
            completionQuestionsPerAbility: 1,
            trainingQuestionsPerAbility: 1,
            includeCompletion: true,
            includeTraining: true,
            ...(config.attempt || {})
        };

        if (config.attempt.promoteAfterQuestions === undefined) {
            config.attempt.promoteAfterQuestions = 1;
        }
        if (config.attempt.demoteAfterQuestions === undefined) {
            config.attempt.demoteAfterQuestions = 1;
        }
        if (config.attempt.questionsPerAbility === undefined) {
            config.attempt.questionsPerAbility = 1;
        }
        if (config.attempt.completionQuestionsPerAbility === undefined) {
            config.attempt.completionQuestionsPerAbility = 1;
        }
        if (config.attempt.trainingQuestionsPerAbility === undefined) {
            config.attempt.trainingQuestionsPerAbility = 1;
        }
        if (config.attempt.includeCompletion === undefined) {
            config.attempt.includeCompletion = true;
        }
        if (config.attempt.includeTraining === undefined) {
            config.attempt.includeTraining = true;
        }

        await connection.query(
            `
            INSERT INTO assessment_type_settings (assessment_type, config)
            VALUES ('diagnostic', ?)
            ON DUPLICATE KEY UPDATE config = VALUES(config)
            `,
            [JSON.stringify(config)]
        );

        console.log("✓ Diagnostic assessment settings updated successfully");

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("✗ Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
