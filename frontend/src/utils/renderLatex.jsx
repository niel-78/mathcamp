import katex from "katex";
import "katex/dist/katex.min.css";

const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// bevara radbrytningar i vanlig text (utanför math-uttryck)
const toHtmlText = (str) =>
  escapeHtml(str).replace(/\n/g, "<br>");

export const renderLatex = (text) => {
  if (!text) return "";

  const safe = String(text);

  // Match $$...$$, \[...\], $...$, \(...\)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;

  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = mathRegex.exec(safe)) !== null) {
    // text före math
    result += toHtmlText(safe.slice(lastIndex, match.index));

    const token = match[0];
    let mathContent = "";
    let isDisplay = false;

    if (token.startsWith("$$") && token.endsWith("$$")) {
      mathContent = token.slice(2, -2);
      isDisplay = true;
    } else if (token.startsWith("\\[") && token.endsWith("\\]")) {
      mathContent = token.slice(2, -2);
      isDisplay = true;
    } else if (token.startsWith("\\(") && token.endsWith("\\)")) {
      mathContent = token.slice(2, -2);
      isDisplay = false;
    } else if (token.startsWith("$") && token.endsWith("$")) {
      mathContent = token.slice(1, -1);
      isDisplay = false;
    }

    try {
      result += katex.renderToString(mathContent, {
        displayMode: isDisplay,
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      result += toHtmlText(token);
    }

    lastIndex = match.index + token.length;
  }

  // resten av texten
  result += toHtmlText(safe.slice(lastIndex));

  return result;
};
