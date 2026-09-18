import "dotenv/config";
import mysql from "mysql2/promise";

const ROUNDING_PATTERN = /Avrunda\s+\$?\s*([\d ]+?)(?:,(\d+))?\s*\$?\s*till\s+(?:närmaste\s+)?(tiotal|hundratal|tusental|tiondel(?:ar)?|hundradel(?:ar)?|en decimal|två decimaler)/i;

const targetDecimals = {
    tiotal: -1,
    hundratal: -2,
    tusental: -3,
    tiondel: 1,
    tiondelar: 1,
    hundradel: 2,
    hundradelar: 2,
    "en decimal": 1,
    "två decimaler": 2
};

export function calculateRoundedAnswer(question) {
    const match = ROUNDING_PATTERN.exec(question);

    if (!match) {
        throw new Error(`Kunde inte tolka fråga: ${question}`);
    }

    const decimalPlaces = targetDecimals[match[3].toLowerCase()];
    const decimalDigits = match[2] || "";
    const unrounded = BigInt(`${match[1].replaceAll(" ", "")}${decimalDigits}`);
    const placesToRemove = decimalDigits.length - decimalPlaces;
    const divisor = 10n ** BigInt(Math.max(placesToRemove, 0));
    const rounded = placesToRemove > 0
        ? (unrounded + divisor / 2n) / divisor
        : unrounded * (10n ** BigInt(-placesToRemove));

    if (decimalPlaces <= 0) {
        return String(rounded * (10n ** BigInt(-decimalPlaces)));
    }

    const digits = rounded.toString().padStart(decimalPlaces + 1, "0");
    return `${digits.slice(0, -decimalPlaces)},${digits.slice(-decimalPlaces)}`;
}

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [questions] = await connection.query(
            `
            SELECT id, question, answer_config
            FROM questions
            WHERE question_type = 'numeric_input'
              AND question LIKE 'Avrunda%'
            `
        );

        let updatedCount = 0;

        for (const question of questions) {
            const answer = calculateRoundedAnswer(question.question);
            const config = typeof question.answer_config === "string"
                ? JSON.parse(question.answer_config || "{}")
                : question.answer_config || {};

            config.default_answer = answer;

            await connection.query(
                `
                UPDATE questions
                SET answer_config = ?, updated_at = NOW()
                WHERE id = ?
                `,
                [JSON.stringify(config), question.id]
            );

            await connection.query(
                `
                UPDATE options
                SET text = ?, updated_at = NOW()
                WHERE question_id = ? AND is_correct = 1
                `,
                [answer, question.id]
            );

            updatedCount++;
        }

        console.log(`Repaired ${updatedCount} rounding answer(s).`);
    } finally {
        await connection.end();
    }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
    migrate().catch(error => {
        console.error("Migration failed:", error.message);
        process.exit(1);
    });
}