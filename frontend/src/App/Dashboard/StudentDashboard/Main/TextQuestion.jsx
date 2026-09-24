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
    const isMobile = typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches;
    const segments = (question.question || "").split(NUMERIC_INPUT_MARKER);
    const hasInlineMarker = segments.length > 1;
    const correctAnswer = (question.options || []).find(option =>
        option.is_correct === true ||
        Number(option.is_correct) === 1 ||
        option.isCorrect === true ||
        Number(option.isCorrect) === 1
    )?.text || "";
    const answerInputStyle = {
        width: `${Math.max(
            12,
            String(correctAnswer).length + 2,
            String(text).length + 2
        )}ch`,
        maxWidth: "none"
    };

    useEffect(() => {
        setText(value || "");
    }, [question.id, value]);

    return (
        <>
            {hasInlineMarker ? (
                <div className={`mb-6 leading-8 ${questionTextClassName} text-left`}>
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
                                    inputMode="none"
                                    readOnly={isMobile}
                                    onTouchStart={event => {
                                        if (isMobile) event.preventDefault();
                                    }}
                                    className="answer-input inline-block mx-1 align-middle border border-slate-500 rounded-md bg-white"
                                    style={answerInputStyle}
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
                    className={`${questionTextClassName} mb-6 block text-left font-medium`}
                />
            )}
            <MathPreview value={text} />

            {!hasInlineMarker && (
                <Input
                    ref={inputRef}
                    type="text"
                    inputMode="none"
                    readOnly={isMobile}
                    onTouchStart={event => {
                        if (isMobile) event.preventDefault();
                    }}
                    className="answer-input"
                    style={answerInputStyle}
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