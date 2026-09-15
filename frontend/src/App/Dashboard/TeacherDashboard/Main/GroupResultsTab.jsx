import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

const reviewOptions = [
    { value: "green", label: "Grön", className: "border-green-300 bg-green-50 text-green-800" },
    { value: "yellow", label: "Gul", className: "border-yellow-300 bg-yellow-50 text-yellow-800" },
    { value: "red", label: "Röd", className: "border-red-300 bg-red-50 text-red-800" }
];

export default function GroupResultsTab({ groupId }) {

    const [results, setResults] = useState([]);
    const [sort, setSort] = useState({
        key: "name",
        direction: "asc"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const loadResults = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/groups/${groupId}/results`,
                    {
                        headers: authHeaders()
                    }
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Kunde inte läsa resultaten.");
                }

                setResults(data);
            } catch (loadError) {
                console.error(loadError);
                setError(loadError.message);
            } finally {
                setLoading(false);
            }
        };

        loadResults();

    }, [groupId]);

    const sortResults = (key) => {
        setSort(currentSort => ({
            key,
            direction:
                currentSort.key === key && currentSort.direction === "asc"
                    ? "desc"
                    : "asc"
        }));
    };

    const updateReview = async (studentId, reviewStatus) => {
        const response = await fetch(
            `${API_URL}/api/groups/${groupId}/students/${studentId}/review`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ review_status: reviewStatus })
            }
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Kunde inte spara omdömet.");
        }

        setResults(currentResults => currentResults.map(result =>
            result.id === studentId
                ? { ...result, review_status: reviewStatus }
                : result
        ));
    };

    const sortedResults = [...results].sort((firstResult, secondResult) => {
        const firstValue = firstResult[sort.key];
        const secondValue = secondResult[sort.key];

        if (firstValue === secondValue) {
            return 0;
        }

        if (firstValue === null || typeof firstValue === "undefined") {
            return 1;
        }

        if (secondValue === null || typeof secondValue === "undefined") {
            return -1;
        }

        const comparison = typeof firstValue === "string"
            ? firstValue.localeCompare(secondValue, "sv")
            : firstValue - secondValue;

        return sort.direction === "asc" ? comparison : -comparison;
    });

    const SortButton = ({ label, sortKey }) => {
        const isActive = sort.key === sortKey;
        const SortIcon = !isActive
            ? ArrowUpDown
            : sort.direction === "asc"
                ? ArrowUp
                : ArrowDown;

        return (
            <button
                type="button"
                className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                onClick={() => sortResults(sortKey)}
                title={`Sortera ${label.toLowerCase()} ${
                    isActive && sort.direction === "asc" ? "fallande" : "stigande"
                }`}
            >
                {label}
                <SortIcon className="h-4 w-4" />
            </button>
        );
    };

    if (loading) {
        return <p className="p-6">Laddar resultat...</p>;
    }

    if (error) {
        return <p className="p-6 text-destructive">{error}</p>;
    }

    return (
        <div className="rounded-xl border bg-white p-5">
            {!results.length && (
                <p className="text-sm text-muted-foreground">
                    Gruppen har inga elever.
                </p>
            )}

            {!!results.length && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2">
                                    <SortButton label="Elev" sortKey="name" />
                                </th>
                                <th className="px-3 py-2">
                                    <SortButton
                                        label="Besvarade frågor"
                                        sortKey="answered_question_count"
                                    />
                                </th>
                                <th className="px-3 py-2">
                                    <SortButton
                                        label="Rätta svar"
                                        sortKey="correct_answer_count"
                                    />
                                </th>
                                <th className="px-3 py-2">
                                    <SortButton
                                        label="Andel rätt"
                                        sortKey="correct_percentage"
                                    />
                                </th>
                                <th className="px-3 py-2">
                                    <SortButton label="Förmågor" sortKey="mastery_average" />
                                </th>
                                <th className="px-3 py-2">Omdöme</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedResults.map(result => (
                                <tr key={result.id} className="border-b last:border-0">
                                    <td className="px-3 py-3 font-medium">{result.name}</td>
                                    <td className="px-3 py-3">{result.answered_question_count}</td>
                                    <td className="px-3 py-3">{result.correct_answer_count}</td>
                                    <td className="px-3 py-3">
                                        {result.correct_percentage === null
                                            ? "-"
                                            : `${result.correct_percentage}%`}
                                    </td>
                                            <td className="px-3 py-3">
                                            {Number.isFinite(Number(result.mastery_average))
                                                ? Number(result.mastery_average).toFixed(2)
                                                : "-"}
                                            </td>
                                    <td className="px-3 py-3">
                                        <select
                                            value={result.review_status || "green"}
                                            className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                                reviewOptions.find(option => option.value === (result.review_status || "green"))?.className
                                            }`}
                                            aria-label={`Omdöme för ${result.name}`}
                                            onChange={async event => {
                                                try {
                                                    await updateReview(result.id, event.target.value);
                                                } catch (updateError) {
                                                    setError(updateError.message);
                                                }
                                            }}
                                        >
                                            {reviewOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}