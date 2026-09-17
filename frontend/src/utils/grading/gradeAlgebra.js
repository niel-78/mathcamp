import { simplify } from "mathjs";

// mathjs can't parse LaTeX \frac{}{} directly, so rewrite it to (num)/(den) first.
const extractBraceGroup = (
    text,
    startIndex
) => {

    let depth = 1;
    let i = startIndex + 1;

    while (i < text.length && depth > 0) {

        if (text[i] === "{") depth++;
        if (text[i] === "}") depth--;

        i++;
    }

    return {
        content: text.slice(startIndex + 1, i - 1),
        endIndex: i
    };
};

const convertLatexFractions = text => {

    let result = "";
    let i = 0;

    while (i < text.length) {

        if (text.startsWith("\\frac{", i)) {

            const numerator =
                extractBraceGroup(text, i + 5);
            const denominator =
                extractBraceGroup(text, numerator.endIndex);

            result +=
                `((${convertLatexFractions(numerator.content)})` +
                `/(${convertLatexFractions(denominator.content)}))`;

            i = denominator.endIndex;

        } else {

            result += text[i];
            i++;
        }
    }

    return result;
};

export const gradeAlgebra = (
    studentAnswer,
    correctAnswer
) => {

    try {

        return (
            simplify(
                `(${convertLatexFractions(studentAnswer)}) - ` +
                `(${convertLatexFractions(correctAnswer)})`
            ).toString() === "0"
        );

    } catch {

        return false;
    }
};