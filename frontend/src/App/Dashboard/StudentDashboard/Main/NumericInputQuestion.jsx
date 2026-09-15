import { useEffect, useState } from "react";
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

    const parseValues = (raw) => {

        if (!raw) {
            return Array(fieldCount).fill("");
        }

        try {

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {

                return Array.from(
                    { length: fieldCount },
                    (_, i) => parsed[i] ?? ""
                );

            }

        } catch (error) {
            // fall through
        }

        return Array(fieldCount).fill("");

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

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            <div className={`leading-8 ${questionTextClassName}`}>

                {segments.map((segment, index) => (

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

            </div>
        </>
    );
}
