import { useEffect, useState } from "react";
import {
    ArrowUp,
    ArrowDown,
    Minus
} from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import ResultPage from "@/App/Dashboard/StudentDashboard/Main/ResultPage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { eventLabels } from "@/constants/eventLabels";
import FormatDateTimeShort from "@/utils/FormatDateTimeShort";
import {
    formatEventDuration,
    normalizeExamEvents,
    summarizeExamAbsences
} from "@/utils/normalizeExamEvents";

export default function StudentTab({
    studentId,
    initialGroupId,
    initialAttemptId
}) {

    const formatEventData = (eventData) => {

        if (!eventData) {
            return null;
        }

        try {

            const parsed = typeof eventData === "string"
                ? JSON.parse(eventData)
                : eventData;

            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed) ||
                Object.keys(parsed).length === 0
            ) {
                return null;
            }

            return Object.entries(parsed)
                .map(([key, value]) => {
                    const renderedValue =
                        typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value);

                    return `${key}: ${renderedValue}`;
                })
                .join(" • ");

        } catch {

            return null;

        }
    };

    const [attempts, setAttempts] = useState([]);
    const [selectedAttemptId, setSelectedAttemptId] =
        useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] =
        useState("");
    const [loading, setLoading] = useState(true);

    const [abilities, setAbilities] = useState([]);
    const [studentEvents, setStudentEvents] = useState([]);
    const [resultTab, setResultTab] = useState("results");

    const groupedEvents = studentEvents.reduce((groups, event) => {

        const key = event.attempt_id || event.assessment_title || "unknown";
        const existingGroup = groups.find(group => group.key === key);

        if (existingGroup) {
            existingGroup.events.push(event);
            return groups;
        }

        groups.push({
            key,
            title: event.assessment_title || "Prov",
            events: [event]
        });

        return groups;
    }, []).map(group => ({
        ...group,
        events: normalizeExamEvents(group.events)
    }));

    useEffect(() => {

        if (!selectedGroupId) {
            return;
        }

        const loadAbilities = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/students/${studentId}/abilities?groupId=${selectedGroupId}`,
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
                setAbilities([]);

            }
        };

        loadAbilities();

    }, [selectedGroupId, studentId]);

    useEffect(() => {

        if (!selectedGroupId) {
            return;
        }

        const loadStudentEvents = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/students/${studentId}/events?groupId=${selectedGroupId}`,
                    {
                        headers: authHeaders()
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                }

                setStudentEvents(data);

            } catch (error) {

                console.error(error);
                setStudentEvents([]);

            }
        };

        loadStudentEvents();

    }, [selectedGroupId, studentId]);

    useEffect(() => {

        const loadGroups = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/students/${studentId}/groups`,
                    {
                        headers: authHeaders()
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                }

                setGroups(data);
                const requestedGroup = data.find(group =>
                    String(group.id) === String(initialGroupId)
                );

                setSelectedGroupId(
                    requestedGroup?.id
                        ? String(requestedGroup.id)
                        : data[0]?.id
                            ? String(data[0].id)
                            : ""
                );

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }
        };

        loadGroups();

    }, [initialGroupId, studentId]);

    useEffect(() => {

        if (!selectedGroupId) {
            return;
        }

        const loadAttempts = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/students/${studentId}/attempts?groupId=${selectedGroupId}`,
                    {
                        headers: authHeaders()
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                }

                setAttempts(data);
                const requestedAttempt = data.find(attempt =>
                    String(attempt.id) === String(initialAttemptId)
                );

                setSelectedAttemptId(
                    requestedAttempt?.id || data[0]?.id || null
                );

            } catch (error) {

                console.error(error);
                setAttempts([]);
                setSelectedAttemptId(null);

            }
        };

        loadAttempts();

    }, [initialAttemptId, selectedGroupId, studentId]);

    if (loading) {
        return <p className="p-6 bg-white h-full">Laddar resultat...</p>;
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="w-full max-w-4xl mx-auto space-y-4">

                <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
                    <Label htmlFor="student-group">
                        Grupp
                    </Label>

                    <select
                        className="input-standard w-full"
                        id="student-group"
                        value={selectedGroupId}
                        onChange={event =>
                            setSelectedGroupId(event.target.value)
                        }
                    >
                        {!groups.length && (
                            <option value="">
                                Inga grupper tillgängliga
                            </option>
                        )}

                        {groups.map(group => (
                            <option
                                key={group.id}
                                value={group.id}
                            >
                                {group.name}
                                {group.course_name
                                    ? ` (${group.course_name})`
                                    : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 rounded-xl border bg-white p-2 shadow-sm flex-wrap">
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

                    <Button
                        variant={
                            resultTab === "activity"
                                ? "default"
                                : "ghost"
                        }
                        onClick={() => setResultTab("activity")}
                    >
                        Elevaktiviteter
                    </Button>
                </div>

                {resultTab === "results" && (
                    <>
                        {!attempts.length && selectedGroupId && (
                            <p className="rounded-xl border bg-white p-6 shadow-sm">
                                Eleven har inga inlämnade prov i den här gruppen.
                            </p>
                        )}

                        {attempts.length > 0 && (
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
                                                <FormatDateTimeShort
                                                    value={attempt.started_at}
                                                />
                                                {" – "}
                                                <FormatDateTimeShort
                                                    value={attempt.last_student_activity_at}
                                                />
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <ResultPage attemptId={selectedAttemptId} />
                            </>
                        )}
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
                                    <div className="space-y-1">
                                        <div className="font-medium">
                                            {ability.name}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                            <span>{ability.series_name}</span>
                                            {ability.next_level && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                                                        Nivå: {ability.next_level}
                                                    </span>
                                                </>
                                            )}
                                            {ability.pages && ability.pages.length > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-medium text-slate-700">
                                                        Träna på sid {ability.pages.join(", ")}
                                                    </span>
                                                </>
                                            )}
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

                {resultTab === "activity" && (
                    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold">
                            Elevaktiviteter
                        </h2>

                        {!studentEvents.length && (
                            <p className="text-sm text-muted-foreground">
                                Inga elevaktiviteter registrerade.
                            </p>
                        )}

                        {groupedEvents.length > 0 && (
                            <div className="space-y-5">
                                {groupedEvents.map(group => (
                                    <div
                                        key={group.key}
                                        className="rounded-xl border bg-white"
                                    >
                                        <div className="border-b bg-slate-50 px-4 py-3 font-semibold text-sm">
                                            {group.title}
                                        </div>

                                        {summarizeExamAbsences(group.events).count > 0 && (
                                            <div className="border-b px-4 py-3 text-xs text-muted-foreground">
                                                Utanför provfönstret {summarizeExamAbsences(group.events).count} gånger
                                                {": totalt "}
                                                {formatEventDuration(summarizeExamAbsences(group.events).total_seconds)}
                                                {", längst "}
                                                {formatEventDuration(summarizeExamAbsences(group.events).longest_seconds)}
                                                {summarizeExamAbsences(group.events).has_ongoing && " • Ett tillfälle pågår"}
                                            </div>
                                        )}

                                        <div className="relative pl-6 pr-4 py-4">
                                            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />

                                            {group.events.map(event => (
                                                <div
                                                    key={event.id}
                                                    className="relative pb-4 last:pb-0"
                                                >
                                                    <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-sky-600" />

                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="font-medium">
                                                            {eventLabels[event.event_type] || event.event_type}
                                                        </div>

                                                        <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                            <FormatDateTimeShort
                                                                value={event.created_at}
                                                            />
                                                        </div>
                                                    </div>

                                                    {event.event_type === "exam_left" && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Varaktighet: {formatEventDuration(event.duration_seconds)}
                                                        </div>
                                                    )}

                                                    {formatEventData(event.event_data) && (
                                                        <div className="mt-1 text-xs text-muted-foreground break-all">
                                                            {formatEventData(event.event_data)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}