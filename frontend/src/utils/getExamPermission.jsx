import db from "../db.js";

async function getExamPermission(
    examId,
    teacherId
) {

    const [[permission]] =
        await db.query(
            `
            SELECT role
            FROM exam_permissions
            WHERE exam_id = ?
                AND teacher_id = ?
            `,
            [
                examId,
                teacherId
            ]
        );

    return permission?.role ?? null;
}