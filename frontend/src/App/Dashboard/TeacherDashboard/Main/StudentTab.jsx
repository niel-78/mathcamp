import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

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

    const [abilities, setAbilities] = useState([]);

    useEffect(() => {

        const loadAbilities = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/students/${studentId}/abilities`,
                    {
                        headers: authHeaders()
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                }

                setAbilities(data);

            } catch (error) {

                console.error(error);

            }
        };

        loadAbilities();

    }, [studentId]);

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
        return <p className="p-6 bg-white h-full">Laddar resultat...</p>;
    }

    return (
        <div className="h-full overflow-y-auto bg-white">

            {abilities.length > 0 && (

                <div className="max-w-4xl mx-auto px-6 pt-6">

                    <h2 className="text-lg font-semibold mb-2">
                        Förmågor
                    </h2>

                    <div className="space-y-2">

                        {abilities.map(ability => (

                            <div
                                key={ability.id}
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-4
                                    rounded-md
                                    border
                                    px-3
                                    py-2
                                    text-sm
                                "
                            >

                                <div>
                                    <div className="font-medium">
                                        {ability.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {ability.series_name}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 font-semibold">

                                    {ability.mastery_trend === "up" && (
                                        <ArrowUp
                                            size={16}
                                            className="text-green-600"
                                        />
                                    )}

                                    {ability.mastery_trend === "down" && (
                                        <ArrowDown
                                            size={16}
                                            className="text-red-600"
                                        />
                                    )}

                                    {ability.mastery_trend === "unchanged" && (
                                        <Minus
                                            size={16}
                                            className="text-muted-foreground"
                                        />
                                    )}

                                    {Math.round(ability.mastery_score)}

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            )}

            {!attempts.length && (

                <p className="p-6">
                    Eleven har inga inlämnade prov.
                </p>

            )}

            {attempts.length > 0 && (

                <>

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

                </>

            )}

        </div>
    );
}