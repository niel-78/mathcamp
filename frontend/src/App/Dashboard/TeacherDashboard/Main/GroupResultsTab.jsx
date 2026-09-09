import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}