import db from "../db.js";

export default async function getAssessmentTypeSettings(type) {

    const [[row]] =
        await db.query(
            `
            SELECT config
            FROM assessment_type_settings
            WHERE assessment_type = ?
            `,
            [type]
        );

    if (!row) {
        return {};
    }

    return typeof row.config === "string"
        ? JSON.parse(row.config)
        : row.config || {};

}
