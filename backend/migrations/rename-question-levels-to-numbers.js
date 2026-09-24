import "dotenv/config";
import db from "../db.js";

const levelNames = ["1", "2", "3", "4"];

try {
    for (const [index, name] of levelNames.entries()) {
        await db.query(
            `
                UPDATE question_levels
                SET name = ?
                WHERE sort_order = ?
            `,
            [name, index + 1]
        );
    }

    console.log("Question levels renamed to 1, 2, 3, and 4.");
} finally {
    await db.end();
}