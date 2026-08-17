import db from "../db.js";

export default async function getExamRole(
    assessmentId,
    teacherId
) {

    const [[permission]] =
        await db.query(
            `
            SELECT role
            FROM assessment_permissions
            WHERE assessment_id = ?
              AND user_id = ?
            `,
            [
                assessmentId,
                teacherId
            ]
        );

    return permission?.role ?? null;

}