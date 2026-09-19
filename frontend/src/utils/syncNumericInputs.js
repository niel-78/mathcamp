export function syncNumericInputs(text, correctCount) {
    const cleanText = (text || "").trim();
    const inputCount = Math.max(Number(correctCount) || 1, 1);

    const trailingInputPattern = /\s*\{\{input\}\}\s*(?:[A-Za-zÅÄÖåäö]+)?$/i;
    let normalized = (cleanText || "")
        .replace(trailingInputPattern, "")
        .replace(/\s*Skriv\s+[^.!?\n]*\{\{input\}\}[^.!?\n]*[.!?]?/gi, "")
        .replace(/\s*(?:Svar|Svara)(?:\s+\d+)?\s*:\s*\{\{input\}\}\s*[.!?]?/gi, "")
        .replace(/\{\{input\}\}/g, "")
        .replace(/\s+([,.!?])/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

    if (normalized && !normalized.endsWith("\n")) {
        normalized += "\n";
    }

    const answerText = inputCount === 1
        ? "Svar: {{input}}"
        : Array.from(
            { length: inputCount },
            (_, index) => `Svar ${index + 1}: {{input}}`
        ).join("\n");

    return normalized ? `${normalized}${answerText}` : answerText;
}
