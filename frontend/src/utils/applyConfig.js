export const applyConfig = (value, config) => {
    if (!config) return value;

    let result = value;

    // 🔵 NUMERIC (uttryck)
    if (config.mode === "numeric") {
        result = result.replace(/[^0-9+\-*/^.,()·]/g, "");
    }

    // 🟠 DECIMAL
    if (config.mode === "decimal") {
        result = result.replace(/[^0-9,.-]/g, "");
    }

    // 🟢 LETTERS
    if (config.mode === "letters") {
        result = result.replace(/[^a-zA-ZåäöÅÄÖ ]/g, "");
    }

    // 🟣 ALGEBRA
    if (config.mode === "algebra") {
        result = result.replace(
        /[^a-zA-Z0-9+\-*/^=(){}\[\]_,.·\\ ]/g,
        ""
        );
    }

    if (config.maxLength) {
        result = result.slice(0, config.maxLength);
    }

    return result;
};