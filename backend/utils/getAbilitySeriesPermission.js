import db from "../db.js";

export default async function
getAbilitySeriesPermission(
    seriesId,
    teacherId
) {

    const [[permission]] =
        await db.query(
            `
            SELECT role
            FROM ability_series_permissions
            WHERE series_id = ?
            AND teacher_id = ?
            `,
            [
                seriesId,
                teacherId
            ]
        );

    return permission?.role ?? null;

}