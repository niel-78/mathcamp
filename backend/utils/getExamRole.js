import db from "../db.js";

export default async function getExamRole(
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