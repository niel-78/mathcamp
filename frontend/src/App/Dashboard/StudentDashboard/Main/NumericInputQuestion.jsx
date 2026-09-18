import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatMathText } from "@/utils/formatMathText";
import { Input } from "@/components/ui/input";
import { NUMERIC_INPUT_MARKER } from "@/constants/assessmentConstants";
import MathKeyboard from "@/components/ui/MathKeyboard";

function isCorrectOption(option) {
    return (
        option?.is_correct === true ||
        Number(option?.is_correct) === 1 ||
        option?.isCorrect === true ||
        Number(option?.isCorrect) === 1
    );
}

export default function NumericInputQuestion({
    question,
    value,
    questionTextClassName = "text-base",
    onBlur
}) {

    const rawQuestion = question.question || "";
    const segments =
        rawQuestion
            .split(NUMERIC_INPUT_MARKER);

    let answerConfig = {};

    try {
        answerConfig =
            typeof question.answer_config === "string"
                ? JSON.parse(question.answer_config || "{}")
                : question.answer_config || {};
    } catch (error) {
        answerConfig = {};
    }

    const isEquation = question.question_type === "equation";
    const orderIndependent =
        isEquation || Boolean(answerConfig.order_independent);
    const markerCount = Math.max(segments.length - 1, 0);
    const correctAnswerCount = Math.max(
        (question.options || []).filter(isCorrectOption).length,
        Array.isArray(answerConfig.correctAnswers)
            ? answerConfig.correctAnswers.filter(answer => String(answer ?? "").trim() !== "").length
            : 0,
        answerConfig.default_answer !== undefined &&
            answerConfig.default_answer !== null &&
            String(answerConfig.default_answer).trim() !== ""
            ? 1
            : 0
    );
    const fieldCount = isEquation
        ? Math.max(correctAnswerCount, 1)
        : markerCount;
    const hasInlineMarkers = markerCount > 0;

    const renderInput = (index) => (
        <Input
            ref={element => {
                inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="decimal"
            className="answer-input inline-block w-24 mx-1 align-middle border border-slate-500 rounded-md bg-white"
            value={values[index] ?? ""}
            onFocus={() => setActiveIndex(index)}
            onChange={e => {

                updateValue(
                    index,
                    e.target.value
                );

            }}
            onBlur={e => {

                const updated =
                    updateValue(
                        index,
                        e.target.value
                    );

                onBlur(
                    JSON.stringify(updated)
                );

            }}
        />
    );

    const parseValues = (raw) => {

        if (!raw) {
            return Array(
                isEquation ? 1 : fieldCount
            ).fill("");
        }

        try {

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {

                return Array.from(
                    {
                        length: Math.max(
                            fieldCount,
                            isEquation ? parsed.length : fieldCount
                        )
                    },
                    (_, i) => parsed[i] ?? ""
                );

            }

        } catch (error) {
            // fall through
        }

        return Array(
            isEquation ? 1 : fieldCount
        ).fill("");

    };

    const [values, setValues] =
        useState(() => parseValues(value));
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRefs = useRef([]);

    useEffect(() => {

        setValues(
            parseValues(value)
        );

    }, [question.id, value]);

    const updateValue = (index, newValue) => {

        const updated = [...values];
        updated[index] = newValue;
        setValues(updated);

        return updated;

    };

    const addAnswer = () => {

        const updated = [...values, ""];
        setValues(updated);
        onBlur(JSON.stringify(updated));

    };

    const removeAnswer = () => {

        if (values.length <= 1) return;

        const updated = values.slice(0, -1);
        setValues(updated);
        onBlur(JSON.stringify(updated));

    };

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            <div className={`leading-8 ${questionTextClassName}`}>

                {isEquation ? (

                    <>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: formatMathText(
                                    (question.question || "")
                                        .replace(
                                            /^\s*(?:[a-zA-Z](?:_\d+)?\s*=\s*)?\{\{input\}\}\s*$/gm,
                                            ""
                                        )
                                        .replaceAll(NUMERIC_INPUT_MARKER, "")
                                        .trim()
                                )
                            }}
                        />

                        <div className="mt-2 space-y-2">

                            {values.map((answer, index) => (

                                <label
                                    key={index}
                                    className="block"
                                >
                                    {values.length === 1 ? (
                                        "x ="
                                    ) : (
                                        <>
                                            x<sub>{index + 1}</sub> =
                                        </>
                                    )}
                                    <Input
                                        ref={element => {
                                            inputRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="decimal"
                                        className="answer-input inline-block w-24 mx-1 align-middle"
                                        value={answer}
                                        onFocus={() => setActiveIndex(index)}
                                        onChange={e => {

                                            updateValue(
                                                index,
                                                e.target.value
                                            );

                                        }}
                                        onBlur={e => {

                                            const updated =
                                                updateValue(
                                                    index,
                                                    e.target.value
                                                );

                                            onBlur(
                                                JSON.stringify(updated)
                                            );

                                        }}
                                    />
                                </label>

                            ))}

                        </div>
                    </>

                ) : hasInlineMarkers ? segments.map((segment, index) => (

                    // plain inline flow (no flexbox) so multi-line prefix text
                    // doesn't vertically center the input against its own height
                    <span key={index}>

                        {segment && (

                            <span
                                dangerouslySetInnerHTML={{
                                    __html: formatMathText(segment)
                                }}
                            />

                        )}

                        {index < fieldCount && (

                            renderInput(index)

                        )}

                    </span>

                )) : (

                    <>

                        <span
                            dangerouslySetInnerHTML={{
                                __html: formatMathText(rawQuestion.trim())
                            }}
                        />

                        <div className="mt-2 space-y-2">

                            {Array.from({ length: fieldCount }, (_, index) => (

                                <label
                                    key={index}
                                    className="block"
                                >
                                    {fieldCount === 1 ? "Svar" : `Svar ${index + 1}`}:
                                    {renderInput(index)}
                                </label>

                            ))}

                        </div>

                    </>

                )}

                {isEquation && (

                    <div className="mt-2 flex items-center gap-2">

                        <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded border"
                            onClick={removeAnswer}
                            aria-label="Ta bort svar"
                            title="Ta bort svar"
                            disabled={values.length <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded border"
                            onClick={addAnswer}
                            aria-label="Lägg till svar"
                            title="Lägg till svar"
                        >
                            <Plus className="h-4 w-4" />
                        </button>

                    </div>

                )}

                <MathKeyboard
                    value={values[activeIndex] ?? ""}
                    inputRef={{
                        current: inputRefs.current[activeIndex]
                    }}
                    onChange={newValue => {
                        const updated = updateValue(activeIndex, newValue);
                        onBlur(JSON.stringify(updated));
                    }}
                />

            </div>
        </>
    );
}
