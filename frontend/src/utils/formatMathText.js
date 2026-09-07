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
        /\\[a-zA-Z]+/.test(result);

    const firstLatexCommandIndex =
        result.search(/\\[a-zA-Z]+/);

    /*
     * Matematiska mönster
     */
    const looksLikeMath =
        /[\^_=]/.test(result) ||
        /\d+\/\d+/.test(result);

    if (
        hasLatexCommands &&
        firstLatexCommandIndex > 0
    ) {
        const instruction =
            result.slice(0, firstLatexCommandIndex);

        const expression =
            result.slice(firstLatexCommandIndex);

        return renderLatex(
            `${instruction}$${expression}$`
        );
    }

    if (hasLatexCommands || looksLikeMath) {
        return renderLatex(`$${result}$`);
    }

    /*
    * Ta bort koefficienten 1 framför variabler
    */
    result = result.replace(
        /\b1([a-zA-Z])/g,
        "$1"
    );

    return result;
};
