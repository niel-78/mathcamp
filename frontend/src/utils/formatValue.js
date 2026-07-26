import { renderLatex } from "./renderLatex";

export const formatValue = (text) => {

    if (typeof text !== "string") {
        return String(text ?? "");
    }

    text = text.trim();

    if (!text) {
        return "—";
    }

    // Rent blockuttryck
    if (
        (text.startsWith("$$") && text.endsWith("$$")) ||
        (text.startsWith("\\[") && text.endsWith("\\]"))
    ) {
        return renderLatex(text);
    }

    // Finns redan latex-markeringar?
    const hasInlineMath =
        text.includes("$") ||
        text.includes("\\(") ||
        text.includes("\\[");

    // Om det finns insprängd matematik:
    // rendera hela strängen som text + matematik
    if (hasInlineMath) {
        return renderLatex(text);
    }

    // Bara vanlig text?
    const onlyLetters =
        /^[a-zA-ZåäöÅÄÖ0-9\s.,!?;:()%-]+$/.test(text);

    if (onlyLetters) {
        return text;
    }

    // Matematikkonverteringar

    let result = text;

    result = result.replace(
        /(\d+)\s*\/\s*(\d+)/g,
        (_, a, b) => `\\frac{${a}}{${b}}`
    );

    result = result.replace(/\*/g, "\\cdot ");
    result = result.replace(/·/g, "\\cdot ");

    // Om uttrycket är mest matematik:
    return renderLatex(`$${result}$`);
};