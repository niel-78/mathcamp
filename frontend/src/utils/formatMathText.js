import { renderLatex } from "./renderLatex";

export const formatMathText = (text) => {

    if (typeof text !== "string") {
        return String(text ?? "");
    }

    text = text.trim();

    if (!text) {
        return "—";
    }

    /*
     * Kompletta latexblock
     */
    if (
        (text.startsWith("$$") && text.endsWith("$$")) ||
        (text.startsWith("\\[") && text.endsWith("\\]"))
    ) {
        return renderLatex(text);
    }

    /*
     * Inline-latex finns redan
     */
    const hasInlineMath =
        text.includes("$") ||
        text.includes("\\(") ||
        text.includes("\\[");

    if (hasInlineMath) {
        return renderLatex(text);
    }

    let result = text;

    /*
     * Vanliga Lexical-rester
     */
    result = result.replace(
        /(\d+)\s*\/\s*(\d+)/g,
        (_, a, b) => `\\frac{${a}}{${b}}`
    );

    result = result.replace(/\*/g, "\\cdot ");

    result = result.replace(
        /·/g,
        "\\cdot "
    );

    /*
     * Vanliga användarmisstag
     */
    result = result.replace(
        /(?<!\\)frac\{/g,
        "\\frac{"
    );

    result = result.replace(
        /(?<!\\)sqrt\{/g,
        "\\sqrt{"
    );

    /*
     * Kända latexkommandon
     */
    const hasLatexCommands =
        /\\(frac|sqrt|cdot|times|pi|alpha|beta|gamma|theta|sin|cos|tan|log|ln)/.test(
            result
        );

    /*
     * Matematiska mönster
     */
    const looksLikeMath =
        /[\^_=]/.test(result) ||
        /\d+\/\d+/.test(result);

    if (
        hasLatexCommands ||
        looksLikeMath
    ) {
        return renderLatex(`$${result}$`);
    }

    return result;
};
