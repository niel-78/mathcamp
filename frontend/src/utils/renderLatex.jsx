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

  // säkerställ att det är ren text
  const safe = String(text);

  // hantera $...$ manuellt
  const regex = /\$(.*?)\$/g;

  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(safe)) !== null) {
    // text före math
    result += toHtmlText(safe.slice(lastIndex, match.index));

    try {
      result += katex.renderToString(match[1], {
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      result += toHtmlText(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // resten av texten
  result += toHtmlText(safe.slice(lastIndex));

  return result;
};
