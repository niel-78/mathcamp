import { useEffect, useRef, useState } from "react";
import MathContent from "@/components/ui/MathContent";
import { Input } from "@/components/ui/input";
import MathPreview from "@/components/ui/MathPreview";
import MathKeyboard from "@/components/ui/MathKeyboard";
import { formatMathText } from "@/utils/formatMathText";
import { NUMERIC_INPUT_MARKER } from "@/constants/assessmentConstants";

export default function TextQuestion({
    question,
    value,
    questionTextClassName = "text-base",
    onBlur
}) {

    const [text, setText] = useState(value || "");
    const inputRef = useRef(null);
    const segments = (question.question || "").split(NUMERIC_INPUT_MARKER);
    const hasInlineMarker = segments.length > 1;

    useEffect(() => {
        setText(value || "");
    }, [question.id, value]);

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            {hasInlineMarker ? (
                <div className={`leading-8 ${questionTextClassName}`}>
                    {segments.map((segment, index) => (
                        <span key={index}>
                            {segment && (
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: formatMathText(segment)
                                    }}
                                />
                            )}

                            {index < segments.length - 1 && (
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    className="answer-input inline-block w-24 mx-1 align-middle border border-slate-500 rounded-md bg-white"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onBlur={e => onBlur(e.target.value)}
                                />
                            )}
                        </span>
                    ))}
                </div>
            ) : (
                <MathContent
                    value={question.question}
                    className={questionTextClassName}
                />
            )}

            <MathPreview value={text} />

            {!hasInlineMarker && (
                <Input
                    ref={inputRef}
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
            )}

            <MathKeyboard
                value={text}
                inputRef={inputRef}
                onChange={newValue => {
                    setText(newValue);
                    onBlur(newValue);
                }}
            />
        </>
    );
}