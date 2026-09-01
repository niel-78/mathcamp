import db from "../db.js";

// Generates a 6-digit access_key not already used by another group_assessments row
export default async function generateUniqueGroupExamKey() {

    while (true) {

        const key = Math.floor(
            100000 +
            Math.random() * 900000
        ).toString();

        const [[existing]] =
            await db.query(
                `
                SELECT id
                FROM group_assessments
                WHERE access_key = ?
                `,
                [key]
            );

        if (!existing) {
            return key;
        }

    }

}
