import { useEffect, useState } from "react";
import { formatMathText } from "@/utils/formatMathText";
import { Input } from "@/components/ui/input";

export default function TextQuestion({
    question,
    value,
    onBlur
}) {

    const [text, setText] = useState(value || "");

    useEffect(() => {
        setText(value || "");
    }, [question.id, value]);

    const config =
        typeof question.math_config === "string"
            ? JSON.parse(question.math_config)
            : question.math_config;

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            <div
                dangerouslySetInnerHTML={{
                    __html: formatMathText(
                        question.question
                    )
                }}
            />

            {config?.mode !== "text" && (
                <div className="preview">
                    <span
                        dangerouslySetInnerHTML={{
                            __html: formatMathText(text)
                        }}
                    />
                </div>
            )}

            <Input
                type="text"
                className="answer-input"
                value={text}
                onChange={e =>
                    setText(e.target.value)
                }
                onBlur={e =>
                    onBlur(e.target.value)
                }
            />
        </>
    );
}