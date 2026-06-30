
export const isMathExpression = (text) => {
    if (!text) return false;

    const t = text.trim();

    // ✅ 1. $$ → alltid latex
    if (t.startsWith("$$") && t.endsWith("$$")) return true;

    // ✅ 2. innehåller latex-kommandon
    if (/\\(frac|sqrt|cdot|times|div)/.test(t)) return true;

    // ✅ 3. innehåller tydliga matematiska operatorer
    if (/[+\-*/^=]/.test(t)) return true;

    // ✅ 4. "ren math" (endast siffror + operatorer)
    if (/^[0-9\s+\-*/^.,()]+$/.test(t)) return true;

    // ✅ 5. fallback → text
    return false;
};
