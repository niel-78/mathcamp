import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import MathContent from "@/components/ui/MathContent";

export default function ResultPage({
    attemptId
}) {

    const [results, setResults] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        if (!attemptId) {
            setResults([]);
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
        results.filter(
            r => r.correct
        ).length;

    return (

        <div className="max-w-4xl mx-auto p-6">

            <h1 className="text-3xl font-bold mb-6">
                Resultat
            </h1>

            <div className="rounded-lg border p-4 mb-6">

                <h2 className="text-xl font-semibold">
                    Poäng
                </h2>

                <p className="text-3xl mt-2">
                    {score} / {results.length}
                </p>

            </div>

            <div className="space-y-4">

                {results.map(
                    (result, index) => (

                        <div
                            key={
                                result.question_id
                            }
                            className="rounded-lg border p-4"
                        >

                            <div className="flex justify-between mb-4">

                                <h3 className="font-semibold">
                                    Fråga {index + 1}
                                </h3>

                                <span
                                    className={
                                        result.correct
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }
                                >
                                    {result.correct
                                        ? "✓ Rätt"
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

                            <MathContent
                                value={
                                    result.question
                                }
                            />

                            <div className="mt-4">

                                <strong>
                                    Ditt svar
                                </strong>

                                {result.question_type === "text" ? (

                                    <MathContent
                                        value={
                                            result.text_answer
                                        }
                                    />

                                ) : (

                                    <ul className="list-disc ml-5">

                                        {result.selected_options.map(
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

                                )}

                            </div>

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