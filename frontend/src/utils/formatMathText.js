import { renderLatex } from "./renderLatex";

/**
 * Förvandlar matematiska mönster och variabler utanför befintliga
 * latexblock ($...$) till giltig LaTeX-syntax så att KaTeX kan rendera dem.
 */
function enhanceMathExpressions(text) {
    if (!text) return "";

    // Dela upp texten i math-block ($$...$$, \[...\], $...$, \(...\)) och vanlig text
    const mathTokenRegex =
        /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mathTokenRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({
                isMath: false,
                text: text.slice(lastIndex, match.index)
            });
        }
        parts.push({
            isMath: true,
            text: match[0]
        });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({
            isMath: false,
            text: text.slice(lastIndex)
        });
    }

    // Bearbeta endast segment utanför befintliga $...$
    return parts
        .map(part => {
            if (part.isMath) {
                return part.text;
            }

            let s = part.text;

            // Korrigera vanliga misstag som saknat backslash framför frac och sqrt
            s = s.replace(/(?<!\\)frac\{/g, "\\frac{");
            s = s.replace(/(?<!\\)sqrt\{/g, "\\sqrt{");

            // Tolka variabler med index: x_1, x_2, y_1, a_n, x_{1,2}, etc. som LaTeX
            s = s.replace(
                /\b([a-zA-Z])_([0-9]+|[a-zA-Z]+|\{[^}]+\})(?![a-zA-Z0-9_])/g,
                "$$$1_$2$"
            );

            // Tolka potenser: (x+1)^2, x^2, 10^3, etc.
            s = s.replace(
                /\(([^)]+)\)\^([0-9]+|[a-zA-Z]+|\{[^}]+\})(?![a-zA-Z0-9\^])/g,
                "$$($1)^$2$"
            );
            s = s.replace(
                /\b([a-zA-Z0-9]+)\^([0-9]+|[a-zA-Z]+|\{[^}]+\})(?![a-zA-Z0-9\^])/g,
                "$$$1^$2$"
            );

            // Tolka vanliga bråk som 3/4 omgivet av mellanslag eller skiljetecken
            s = s.replace(
                /(^|[\s(])(\d+)\s*\/\s*(\d+)(?=[)\s,.]|$)/g,
                "$1$\\frac{$2}{$3}$"
            );

            // Omslut fristående latexkommandon som inte redan är i math-läge
            s = s.replace(
                /(\\[a-zA-Z]+(\{[^}]*\})*)/g,
                (cmd) => `$${cmd}$`
            );

            // Multiplikationspunkter
            s = s.replace(/(\d|[a-zA-Z])\s*[\*·]\s*(\d|[a-zA-Z])/g, "$1 \\cdot $2");

            return s;
        })
        .join("");
}

export const formatMathText = (text) => {
    if (typeof text !== "string") {
        return String(text ?? "");
    }

    if (!text) {
        return "—";
    }

    const enhanced = enhanceMathExpressions(text);
    return renderLatex(enhanced);
};
