import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import ResultPage from "@/App/Dashboard/StudentDashboard/Main/ResultPage";

export default function StudentTab({
    studentId
}) {

    const [attempts, setAttempts] = useState([]);
    const [selectedAttemptId, setSelectedAttemptId] =
        useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadAttempts = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/students/${studentId}/attempts`,
                    {
                        headers: authHeaders()
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                }

                setAttempts(data);
                setSelectedAttemptId(data[0]?.id || null);

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }
        };

        setLoading(true);
        loadAttempts();

    }, [studentId]);

    if (loading) {
        return <p className="p-6">Laddar resultat...</p>;
    }

    if (!attempts.length) {
        return (
            <p className="p-6">
                Eleven har inga inlämnade prov.
            </p>
        );
    }

    return (
        <div className="h-full overflow-y-auto">

            <div className="max-w-4xl mx-auto px-6 pt-6">

                <label
                    className="block text-sm font-medium mb-2"
                    htmlFor="student-attempt"
                >
                    Prov
                </label>

                <select
                    className="w-full max-w-md rounded-md border bg-background px-3 py-2"
                    id="student-attempt"
                    value={selectedAttemptId || ""}
                    onChange={event =>
                        setSelectedAttemptId(event.target.value)
                    }
                >
                    {attempts.map(attempt => (
                        <option
                            key={attempt.id}
                            value={attempt.id}
                        >
                            {attempt.title || "Namnlöst prov"}
                            {" - "}
                            {new Date(
                                attempt.submitted_at
                            ).toLocaleString("sv-SE")}
                        </option>
                    ))}
                </select>

            </div>

            <ResultPage attemptId={selectedAttemptId} />

        </div>
    );
}