function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function normalizeValue(text) {

    const s = String(text ?? "")
        .replace(/^\$+|\$+$/g, "")
        .replace(/\s+/g, "")
        .trim();

    const fracMatch = /^(-)?\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);

    if (fracMatch) {
        const sign = fracMatch[1] ? -1 : 1;
        const n = sign * Number(fracMatch[2]);
        const d = Number(fracMatch[3]);
        const g = gcd(Math.abs(n), d) || 1;
        return `${n / g}/${d / g}`;
    }

    if (/^-?\d+$/.test(s)) {
        return `${Number(s)}/1`;
    }

    const linearMatch = /^(-?\d*)x([+-]\d+)?$/.exec(s);

    if (linearMatch) {
        const aStr = linearMatch[1];
        const a = aStr === "" ? 1 : aStr === "-" ? -1 : Number(aStr);
        const b = linearMatch[2] ? Number(linearMatch[2]) : 0;
        return `lin:${a}:${b}`;
    }

    return `raw:${s.toLowerCase()}`;

}

// Checks that all options for a single/multiple-choice question have distinct
// values, and that no incorrect option shares its value with a correct one.
export function checkOptionValues(options) {

    const items = (options || []).map(option => ({
        ...option,
        norm: normalizeValue(option.text)
    }));

    const issues = [];

    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {

            if (items[i].norm !== items[j].norm) {
                continue;
            }

            if (items[i].is_correct || items[j].is_correct) {
                issues.push(
                    `"${items[i].text}" och "${items[j].text}" har samma v\u00e4rde som facit`
                );
            } else {
                issues.push(
                    `"${items[i].text}" och "${items[j].text}" har samma v\u00e4rde`
                );
            }

        }
    }

    return {
        valid: issues.length === 0,
        issues
    };

}
