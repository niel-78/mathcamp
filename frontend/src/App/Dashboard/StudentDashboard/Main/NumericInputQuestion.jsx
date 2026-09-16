import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatMathText } from "@/utils/formatMathText";
import { Input } from "@/components/ui/input";
import { NUMERIC_INPUT_MARKER } from "@/constants/assessmentConstants";

// Splits the question text on the {{input}} marker and renders a numeric input
// box at each marker position (with the surrounding text as prefix/suffix).
export default function NumericInputQuestion({
    question,
    value,
    questionTextClassName = "text-base",
    onBlur
}) {

    const segments =
        (question.question || "")
            .split(NUMERIC_INPUT_MARKER);

    const fieldCount =
        Math.max(
            segments.length - 1,
            0
        );

    let answerConfig = {};

    try {
        answerConfig =
            typeof question.answer_config === "string"
                ? JSON.parse(question.answer_config || "{}")
                : question.answer_config || {};
    } catch (error) {
        answerConfig = {};
    }

    const orderIndependent = Boolean(answerConfig.order_independent);

    const parseValues = (raw) => {

        if (!raw) {
            return Array(
                orderIndependent ? 1 : fieldCount
            ).fill("");
        }

        try {

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {

                return Array.from(
                    {
                        length: Math.max(
                            fieldCount,
                            orderIndependent ? parsed.length : 0
                        )
                    },
                    (_, i) => parsed[i] ?? ""
                );

            }

        } catch (error) {
            // fall through
        }

        return Array(
            orderIndependent ? 1 : fieldCount
        ).fill("");

    };

    const [values, setValues] =
        useState(() => parseValues(value));

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

                {orderIndependent ? (

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
                                    x<sub>{index + 1}</sub> =
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        className="answer-input inline-block w-24 mx-1 align-middle"
                                        value={answer}
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

                ) : segments.map((segment, index) => (

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

                            <Input
                                type="text"
                                inputMode="decimal"
                                className="answer-input inline-block w-24 mx-1 align-middle"
                                value={values[index] ?? ""}
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

                        )}

                    </span>

                ))}

                {orderIndependent && fieldCount > 1 && (

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

            </div>
        </>
    );
}
