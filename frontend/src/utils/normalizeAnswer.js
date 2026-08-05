export const normalizeAnswer = (
    text = "",
    {
        removeCommas = true
    } = {}
) => {

    let result = String(text)
        .toLowerCase()
        .trim()
        .replace(/\./g, "")
        .replace(/\s+/g, "");

    if (removeCommas) {
        result = result.replace(/,/g, "");
    }

    return result;
};