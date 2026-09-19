import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import MathContent from "@/components/ui/MathContent";
import { formatMathText } from "@/utils/formatMathText";
import { NUMERIC_INPUT_MARKER } from "@/constants/assessmentConstants";
import { getFieldMatches } from "@/utils/grading/gradeNumericInput";
import { SavedQuestionImage } from "./MathQuestionMedia";

export default function ResultPage({
    attemptId
}) {

    const [results, setResults] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [diagnosticStatus, setDiagnosticStatus] =
        useState(null);

    useEffect(() => {

        if (!attemptId) {
            setResults([]);
            setDiagnosticStatus(null);
            setLoading(false);
            return;
        }

        const loadResults = async () => {

            try {

                const res = await fetch(
                    `${API_URL}/api/assessment-attempts/${attemptId}/results`,
                    {
                        headers: authHeaders()
                    }
                );

                const data =
                    await res.json();

                setResults(
                    data.results || []
                );

                setDiagnosticStatus({
                    complete: data.diagnostic_complete,
                    minimumQuestionCount:
                        data.minimum_question_count,
                    answeredQuestionCount:
                        data.answered_question_count
                });

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);
            }
        };

        loadResults();

    }, [attemptId]);

    if (loading) {
        return <p>Laddar resultat...</p>;
    }

    const score =
        results.reduce(
            (sum, r) =>
                sum + (r.points ?? (r.correct ? 1 : 0)),
            0
        );

    const displayScore =
        Number.isInteger(score)
            ? score
            : Math.round(score * 100) / 100;

    return (

        <div className="mx-auto w-full min-w-0 max-w-4xl p-3 sm:p-6">

            <h1 className="text-3xl font-bold mb-6">
                Resultat
            </h1>

            <div className="rounded-lg border p-4 mb-6">

                <h2 className="text-xl font-semibold">
                    Poäng
                </h2>

                <p className="text-3xl mt-2">
                    {displayScore} / {results.length}
                </p>

            </div>

            <div className="space-y-4">

                {results.map(
                    (result, index) => (

                        <div
                            key={
                                result.question_id
                            }
                            className="min-w-0 rounded-lg border p-3 sm:p-4"
                        >

                            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">

                                <h3 className="font-semibold">
                                    Fråga {index + 1}
                                </h3>

                                <span
                                    className={
                                        result.correct
                                            ? "text-green-600 dark:text-green-400"
                                            : result.points > 0
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-red-600 dark:text-red-400"
                                    }
                                >
                                    {result.correct
                                        ? "✓ Rätt"
                                        : result.points > 0
                                            ? `◐ Delvis rätt (${Math.round(result.points * 100) / 100} p)`
                                            : "✗ Fel"}
                                </span>

                            </div>

                            <dl className="mb-4 grid gap-1 text-sm sm:grid-cols-4">

                                <div>
                                    <dt className="font-semibold">
                                        Sektion
                                    </dt>
                                    <dd>
                                        {result.section_names || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold">
                                        Nivå
                                    </dt>
                                    <dd>
                                        {result.level_name || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold">
                                        Förmåga
                                    </dt>
                                    <dd>
                                        {result.ability_names || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold">
                                        Tid
                                    </dt>
                                    <dd>
                                        {result.duration_seconds != null
                                            ? `${result.duration_seconds} s`
                                            : "-"}
                                    </dd>
                                </div>

                            </dl>

                            {result.selection_reason && (

                                <p
                                    className="
                                        mb-4
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    {result.selection_reason}
                                </p>

                            )}

                            {result.media?.length > 0 && (
                                <div className="mb-4 flex flex-wrap justify-center gap-3">
                                    {result.media.map(media => (
                                        <SavedQuestionImage
                                            key={media.id}
                                            media={media}
                                        />
                                    ))}
                                </div>
                            )}

                            {["numeric_input", "equation"].includes(result.question_type) ? (

                                <div className="leading-8">

                                    {(() => {

                                        const segments =
                                            (result.question || "")
                                                .split(NUMERIC_INPUT_MARKER);

                                        const markerCount = Math.max(segments.length - 1, 0);

                                        let studentValues = [];

                                        try {
                                            studentValues =
                                                JSON.parse(result.text_answer || "[]");
                                        } catch (error) {
                                            studentValues = [];
                                        }

                                        const config =
                                            typeof result.answer_config === "string"
                                                ? JSON.parse(result.answer_config || "{}")
                                                : result.answer_config || {};

                                        const fieldMatches =
                                            getFieldMatches(
                                                studentValues,
                                                result.correct_options.map(o => o.text),
                                                config
                                            );

                                        if (markerCount === 0) {
                                            const displayValues = Array.from(
                                                {
                                                    length: Math.max(
                                                        studentValues.length,
                                                        result.correct_options.length,
                                                        1
                                                    )
                                                },
                                                (_, index) => studentValues[index] || ""
                                            );

                                            return (
                                                <>
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: formatMathText(result.question || "")
                                                        }}
                                                    />

                                                    <div className="mt-2 space-y-2">
                                                        {displayValues.map((value, index) => (
                                                            <div key={index}>
                                                                <span className="mr-2">
                                                                    {displayValues.length === 1 ? "Svar" : `Svar ${index + 1}`}:
                                                                </span>
                                                                <strong
                                                                    className={`
                                                                        inline-block
                                                                        mx-1
                                                                        px-2
                                                                        py-0.5
                                                                        rounded-md
                                                                        border-2
                                                                        ${
                                                                            fieldMatches[index]
                                                                                ? "border-green-600 bg-green-50"
                                                                                : "border-red-600 bg-red-50"
                                                                        }
                                                                    `}
                                                                >
                                                                    {value || "–"}
                                                                </strong>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        }

                                        return segments.map((segment, index) => (

                                            <span key={index}>

                                                {segment && (

                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: formatMathText(segment)
                                                        }}
                                                    />

                                                )}

                                                {index < segments.length - 1 && (

                                                    <strong
                                                        className={`
                                                            inline-block
                                                            mx-1
                                                            px-2
                                                            py-0.5
                                                            rounded-md
                                                            border-2
                                                            ${
                                                                fieldMatches[index]
                                                                    ? "border-green-600 bg-green-50"
                                                                    : "border-red-600 bg-red-50"
                                                            }
                                                        `}
                                                    >
                                                        {
                                                            studentValues[index] ||
                                                            "–"
                                                        }
                                                    </strong>

                                                )}

                                            </span>

                                        ));

                                    })()}

                                </div>

                            ) : (

                                <MathContent
                                    value={
                                        result.question
                                    }
                                />

                            )}

                            {!['numeric_input', 'equation'].includes(result.question_type) && (

                            <div className="mt-4">

                                <strong>
                                    Ditt svar
                                </strong>

                                {["expression", "text"].includes(result.question_type) ? (

                                    <div
                                        className={`
                                            inline-block
                                            mt-1
                                            px-2
                                            py-0.5
                                            rounded-md
                                            border-2
                                            ${
                                                result.correct
                                                    ? "border-green-600 bg-green-50"
                                                    : "border-red-600 bg-red-50"
                                            }
                                        `}
                                    >

                                        <MathContent
                                            value={
                                                result.text_answer
                                            }
                                        />

                                    </div>

                                ) : (

                                    <ul className="list-disc ml-5">

                                        {result.selected_options.map(
                                            option => {

                                                const isOptionCorrect =
                                                    result.correct_options.some(
                                                        correctOption =>
                                                            correctOption.id === option.id
                                                    );

                                                return (

                                                    <li
                                                        key={option.id}
                                                    >

                                                        <span
                                                            className={`
                                                                inline-block
                                                                px-2
                                                                py-0.5
                                                                rounded-md
                                                                border-2
                                                                ${
                                                                    isOptionCorrect
                                                                        ? "border-green-600 bg-green-50"
                                                                        : "border-red-600 bg-red-50"
                                                                }
                                                            `}
                                                        >

                                                            <MathContent
                                                                value={
                                                                    option.text
                                                                }
                                                            />

                                                        </span>

                                                    </li>

                                                );

                                            }
                                        )}

                                    </ul>

                                )}

                            </div>

                            )}

                            <div className="mt-4">

                                <strong>
                                    Rätt svar
                                </strong>

                                <ul className="list-disc ml-5">

                                    {result.correct_options.map(
                                        option => (

                                            <li
                                                key={option.id}
                                            >
                                                <MathContent
                                                    value={
                                                        option.text
                                                    }
                                                />
                                            </li>

                                        )
                                    )}

                                </ul>

                            </div>

                        </div>

                    )
                )}

            </div>

        </div>
    );
}