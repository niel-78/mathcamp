import db from "../db.js";

async function getExamPermission(
    assessmentId,
    teacherId
) {

    const [[permission]] =
        await db.query(
            `
            SELECT role
            FROM assessment_permissions
            WHERE assessment_id = ?
                AND teacher_id = ?
            `,
            [
                assessmentId,
                teacherId
            ]
        );

    return permission?.role ?? null;
}