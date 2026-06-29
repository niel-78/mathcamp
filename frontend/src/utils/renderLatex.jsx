import katex from "katex";
import "katex/dist/katex.min.css";

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
    result += safe.slice(lastIndex, match.index);

    try {
      result += katex.renderToString(match[1], {
        throwOnError: false,
      });
    } catch {
      result += match[0];
    }

    lastIndex = match.index + match[0].length;
  }

  // resten av texten
  result += safe.slice(lastIndex);

  return result;
};
