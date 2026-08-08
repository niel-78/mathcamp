import db from "../db.js";

export async function getAppSettings() {

    const [rows] =
        await db.query(
            `
            SELECT settings
            FROM app_settings
            WHERE id = 1
            `
        );

    if (!rows.length) {
        return {};
    }

    const settings =
        rows[0].settings;

    return typeof settings === "string"
        ? JSON.parse(settings)
        : settings;

}