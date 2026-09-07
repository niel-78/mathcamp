import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import ResultPage from "@/App/Dashboard/StudentDashboard/Main/ResultPage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function StudentTab({
    studentId
}) {

    const [attempts, setAttempts] = useState([]);
    const [selectedAttemptId, setSelectedAttemptId] =
        useState(null);
    const [loading, setLoading] = useState(true);

    const [abilities, setAbilities] = useState([]);
    const [resultTab, setResultTab] = useState("results");

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
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="w-full max-w-4xl mx-auto space-y-4">

                <div className="flex gap-2 rounded-xl border bg-white p-2 shadow-sm">
                    <Button
                        variant={
                            resultTab === "results"
                                ? "default"
                                : "ghost"
                        }
                        onClick={() => setResultTab("results")}
                    >
                        Resultat
                    </Button>

                    <Button
                        variant={
                            resultTab === "abilities"
                                ? "default"
                                : "ghost"
                        }
                        onClick={() => setResultTab("abilities")}
                    >
                        Förmågor
                    </Button>
                </div>

                {resultTab === "results" && !attempts.length && (
                    <p className="rounded-xl border bg-white p-6 shadow-sm">
                        Eleven har inga inlämnade prov.
                    </p>
                )}

                {resultTab === "results" && attempts.length > 0 && (
                    <>
                        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
                            <Label htmlFor="student-attempt">
                                Resultat
                            </Label>

                            <select
                                className="input-standard w-full"
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

                {resultTab === "abilities" && (
                    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold">
                            Förmågor
                        </h2>

                        {abilities.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Inga förmågor hittades för eleven.
                            </p>
                        )}

                        <div className="space-y-2">
                            {abilities.map(ability => (
                                <div
                                    key={ability.id}
                                    className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {ability.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {ability.series_name}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 font-semibold">
                                        {ability.mastery_trend === "up" && (
                                            <ArrowUp className="h-4 w-4 text-green-600" />
                                        )}

                                        {ability.mastery_trend === "down" && (
                                            <ArrowDown className="h-4 w-4 text-red-600" />
                                        )}

                                        {ability.mastery_trend === "unchanged" && (
                                            <Minus className="h-4 w-4 text-muted-foreground" />
                                        )}

                                        {Math.round(
                                            Number(ability.mastery_score)
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}