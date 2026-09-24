const databaseDatePattern =
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export function parseDatabaseDate(value) {
    if (value instanceof Date) {
        return value;
    }

    if (
        typeof value === "string" &&
        databaseDatePattern.test(value)
    ) {
        return new Date(
            value.replace(" ", "T")
        );
    }

    return new Date(value);
}