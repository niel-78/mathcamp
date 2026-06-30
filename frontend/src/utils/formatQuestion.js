import { formatValue } from "./formatValue";
import { renderLatex } from "./renderLatex";

export const formatQuestion = (text) => {
    if (!text) return "";

    // ✅ 1. $$ block latex
    if (text.startsWith("$$") && text.endsWith("$$")) {
        return renderLatex(text);
    }

    // ✅ 2. inline latex ($...$)
    if (text.includes("$")) {
        const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

        return parts
        .map(part => {
            if (
            (part.startsWith("$") && part.endsWith("$")) ||
            (part.startsWith("$$") && part.endsWith("$$"))
            ) {
            return renderLatex(part);
            }
            return part;
        })
        .join("");
    }

    // ✅ 3. ren latex utan $ (t.ex \cdot, \frac, etc)
    if (/\\[a-zA-Z]+/.test(text)) {
        return renderLatex(`$${text}$`);
    }

    // ✅ 4. ren math (siffror + operatorer)
    if (/^[0-9\s+\-*/^().,]+$/.test(text)) {
        return renderLatex(`$${text}$`);
    }

    // ✅ 5. annars → text
    return text;
};
