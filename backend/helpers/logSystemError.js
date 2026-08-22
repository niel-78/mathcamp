import db from "../db.js";

export default async function logSystemError({
    source,
    error,
    context = {}
}) {

    await db.execute(
        `
        INSERT INTO system_errors
        (
            source,
            message,
            stacktrace,
            context
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            source,
            error.message,
            error.stack,
            JSON.stringify(context)
        ]
    );

}