
import katex from "katex";

export function renderLatex(text) {
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

    return parts.map((part, i) => {
        if (part.startsWith("$$")) {
            return (
                <div
                    key={i}
                    dangerouslySetInnerHTML={{
                    __html: katex.renderToString(part.slice(2, -2), {
                        displayMode: true,
                        throwOnError: false,
                        }),
                    }}
                />
            );
        }

        if (part.startsWith("$")) {
            return (
                <span
                    key={i}
                    dangerouslySetInnerHTML={{
                        __html: katex.renderToString(part.slice(1, -1), {
                        throwOnError: false,
                        }),
                    }}
                />
            );
        }

        return <span key={i}>{part}</span>;
    });
}
