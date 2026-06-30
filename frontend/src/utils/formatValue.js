import { renderLatex } from "./renderLatex";

export const formatValue = (text) => {
    
    if (typeof text !== "string") {
        return String(text ?? "");
    }

    if (!text) return "—";

    // ✅ 1. HEL LATEX (block $$...$$)
    if (text.startsWith("$$") && text.endsWith("$$")) {
        return renderLatex(text); // ✅ returnera direkt, STOPP!
    }

    // ✅ 2. ENDAST bokstäver
    const onlyLetters = /^[a-zA-ZåäöÅÄÖ\s.,!?]+$/.test(text);
    if (onlyLetters) return text;

    let result = text;

    // ✅ 3. FRACTIONS
    result = result.replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => {
        return `\\frac{${a}}{${b}}`;
    });

    // ✅ 4. multiplikation
    result = result.replace(/\*/g, "\\cdot ");
    result = result.replace(/·/g, "\\cdot ");

    // ✅ 5. ALLT ANNAT → wrap
    return renderLatex(`$${result}$`);
};

