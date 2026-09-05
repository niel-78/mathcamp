import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Header from "./StudentDashboard/Header";
import Main from "./StudentDashboard/Main";
import StartExamErrorDialog from "./StudentDashboard/Main/StartExamErrorDialog";
import ExamPage from "./StudentDashboard/Main/ExamPage";
import ResultPage from "./StudentDashboard/Main/ResultPage";
import WaitingRoomPage from "./StudentDashboard/Main/WaitingRoomPage";
import LockedExamPage from "./StudentDashboard/Main/LockedExamPage";
import CompetitionTab from "@/components/addons/CompetitionTab";
import { toast } from "sonner";
import { logEvent } from "@/utils/logEvent";
import {
    KeyRound,
    Trophy,
    ClipboardList,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Minus
} from "lucide-react";

const StudentDashboard = () => {
    const [assessmentKey, setExamKey] = useState("");
    const [attemptId, setAttemptId] = useState(null);
    const [assessmentConfig, setExamConfig] = useState(null);
    const [view, setView] = useState("start");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorOpen, setErrorOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [loadingResults, setLoadingResults] = useState(false);
    const [resultAttempts, setResultAttempts] = useState([]);
    const [resultAbilities, setResultAbilities] = useState([]);
    const [resultTab, setResultTab] = useState("results");

    const [groupExam, setGroupExam] = useState(null);

    useEffect(() => {

        const loadGroups = async () => {

            const response = await fetch(
                `${API_URL}/api/students/me/groups`,
                {
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            setGroups(data);
            setSelectedGroupId(
                data[0]?.id
                    ? String(data[0].id)
                    : ""
            );

        };

        loadGroups();

    }, []);

    const findExam = async () => {
        const res = await fetch(
            `${API_URL}/api/group-assessment-lobby/find`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    group_assessment_key: assessmentKey
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            setErrorMessage(data.error);
            setErrorOpen(true);
            return;
        }

        const joinRes = await fetch(
            `${API_URL}/api/group-assessment-lobby/join`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    group_assessment_key: assessmentKey
                })
            }
        );

        const joinData = await joinRes.json();

        if (!joinRes.ok) {
            setErrorMessage(joinData.error);
            setErrorOpen(true);
            return;
        }

        setGroupExam(data);
        setView("waiting-room");
    };

    const startExamAttempt = async () => {
        const res = await fetch(
            `${API_URL}/api/assessment-attempts/start`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    group_assessment_id: groupExam.group_assessment_id
                })
            }
        );

        const data = await res.json();
        const navigation = performance.getEntriesByType("navigation")[0];

        if (data.resume && navigation?.type === "reload") {
            logEvent(data.attempt_id, "page_refresh");
        }

        if (!res.ok) {
            setErrorMessage(data.error);
            setErrorOpen(true);
            return;
        }

        if (data.status === "locked") {
            setAttemptId(data.attempt_id);
            setView("locked");
            return;
        }

        setAttemptId(data.attempt_id);
        setExamConfig(data.config);

        if (data.resume && data.status !== "locked") {
            toast.info("Du återupptar ett pågående prov.");
        }

        setView("assessment");
    };

    const openSelectedGroupResults = async () => {

        if (!selectedGroupId) {
            setErrorMessage(
                "Välj en grupp först."
            );
            setErrorOpen(true);
            return;
        }

        setLoadingResults(true);

        try {

            const [attemptsResponse, abilitiesResponse] = await Promise.all([
                fetch(
                    `${API_URL}/api/students/me/groups/${selectedGroupId}/attempts`,
                    {
                        headers: authHeaders()
                    }
                ),
                fetch(
                    `${API_URL}/api/students/me/groups/${selectedGroupId}/abilities`,
                    {
                        headers: authHeaders()
                    }
                )
            ]);

            const attemptsData = await attemptsResponse.json();
            const abilitiesData = await abilitiesResponse.json();

            if (!attemptsResponse.ok) {
                setErrorMessage(attemptsData.error);
                setErrorOpen(true);
                return;
            }

            if (!abilitiesResponse.ok) {
                setErrorMessage(abilitiesData.error);
                setErrorOpen(true);
                return;
            }

            setResultAttempts(attemptsData);
            setResultAbilities(abilitiesData);
            setAttemptId(attemptsData[0]?.id || null);
            setResultTab("results");
            setView("result");

        } finally {

            setLoadingResults(false);

        }

    };

    // --- VYER ---

    if (view === "waiting-room") {
        return (
            <WaitingRoomPage
                groupExam={groupExam}
                onStart={startExamAttempt}
                onLocked={(attemptId) => {
                    setAttemptId(attemptId);
                    setView("locked");
                }}
            />
        );
    }

    if (view === "assessment") {
        return (
            <ExamPage
                attemptId={attemptId}
                assessmentConfig={assessmentConfig}
                onExit={() => setView("result")}
                onLocked={() => setView("locked")}
            />
        );
    }

    if (view === "locked") {
        return (
            <LockedExamPage
                attemptId={attemptId}
                onUnlocked={() => setView("assessment")}
            />
        );
    }

    if (view === "result") {
        return (
            <div className="h-screen flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    <div className="w-full max-w-4xl mx-auto space-y-4">
                        <Button variant="ghost" onClick={() => setView("start")} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Tillbaka till start
                        </Button>

                        <div className="flex gap-2 rounded-xl border bg-white p-2 shadow-sm">
                            <Button
                                variant={
                                    resultTab === "results"
                                        ? "default"
                                        : "ghost"
                                }
                                onClick={() =>
                                    setResultTab("results")
                                }
                            >
                                Resultat
                            </Button>

                            <Button
                                variant={
                                    resultTab === "abilities"
                                        ? "default"
                                        : "ghost"
                                }
                                onClick={() =>
                                    setResultTab("abilities")
                                }
                            >
                                Förmågor
                            </Button>
                        </div>

                        {resultTab === "results" && resultAttempts.length > 0 && (
                            <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
                                <Label htmlFor="resultAttempt">
                                    Resultat
                                </Label>

                                <select
                                    id="resultAttempt"
                                    className="input-standard w-full"
                                    value={attemptId || ""}
                                    onChange={(event) =>
                                        setAttemptId(
                                            event.target.value
                                        )
                                    }
                                >
                                    {resultAttempts.map(attempt => (
                                        <option
                                            key={attempt.id}
                                            value={attempt.id}
                                        >
                                            {attempt.title || "Namnlöst prov"}
                                            {" - "}
                                            {new Date(
                                                attempt.submitted_at ||
                                                attempt.started_at
                                            ).toLocaleString("sv-SE")}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {resultTab === "results" && (
                            <ResultPage attemptId={attemptId} />
                        )}

                        {resultTab === "abilities" && (
                            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                                <h2 className="text-2xl font-bold">
                                    Förmågor
                                </h2>

                                {resultAbilities.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Inga förmågor hittades för vald grupp.
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {resultAbilities.map(ability => (
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
                </main>
            </div>
        );
    }

    if (view === "investments") {
        return (
            <div className="h-screen flex flex-col">
                <Header />
                <div className="p-4 bg-muted/20 border-b">
                    <Button variant="ghost" onClick={() => setView("start")} className="gap-2 text-xs">
                        <ArrowLeft className="h-4 w-4" /> Tillbaka till huvudmeny
                    </Button>
                </div>
                <div className="flex-1 overflow-auto">
                    <CompetitionTab
                        groupId={selectedGroupId}
                    /> 
                </div>
            </div>
        );
    }

    if (view === "key-entry") {
        return (
            <div className="h-screen flex flex-col">
                <Header />
                <Main>
                    <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-4">
                        <Button variant="ghost" onClick={() => setView("start")} className="gap-2 -ml-2 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Tillbaka
                        </Button>
                        
                        <h2 className="text-2xl font-bold">Starta prov</h2>
                        <Label className="text-muted-foreground" htmlFor="assessmentKey">
                            Ange provnyckel för att starta provet.
                        </Label>
                        
                        <Input
                            placeholder="T.ex. PROV-1234"
                            value={assessmentKey}
                            id="assessmentKey"
                            onChange={(e) => setExamKey(e.target.value)}
                        />
                        
                        <Button onClick={findExam} className="w-full">
                            Anslut till prov
                        </Button>
                    </div>
                </Main>
                <StartExamErrorDialog
                    open={errorOpen}
                    onOpenChange={setErrorOpen}
                    message={errorMessage}
                />
            </div>
        );
    }

    // HUVUDMENY (START-VYN)
    return (
        <div className="h-screen flex flex-col">
            <Header />

            <Main>
                <div className="w-full max-w-lg rounded-xl border bg-white p-8 shadow-sm space-y-6 text-center">
                    <div>
                        <h2 className="text-3xl font-extrabold text-foreground">Välkommen!</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Välj vad du vill göra härnäst.
                        </p>
                    </div>

                    <div className="space-y-2 text-left">
                        <Label  htmlFor="studentGroup"
                                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase text-left px-1">
                            Grupp
                        </Label>
                    
                        <select
                            id="studentGroup"
                            className="input-standard w-full"
                            value={selectedGroupId}
                            onChange={(event) =>
                                setSelectedGroupId(
                                    event.target.value
                                )
                            }
                        >
                            {groups.length === 0 && (
                                <option value="">
                                    Ingen grupp hittades
                                </option>
                            )}

                            {groups.map(group => (
                                <option
                                    key={group.id}
                                    value={group.id}
                                >
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 pt-2">
                        {/* SEKTION 1: PROV & RESULTAT */}
                        <div className="space-y-3">
                            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase text-left px-1">
                                Prov & Bedömning
                            </div>

                            {/* Skriv prov */}
                            <Button
                                variant="outline"
                                className="w-full h-auto p-4 flex items-center justify-start gap-4 border-2 hover:border-primary hover:bg-primary/5 transition"
                                onClick={() => setView("key-entry")}
                            >
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-base">Skriv prov</div>
                                    <div className="text-xs text-muted-foreground">Anslut med provnyckel från din lärare</div>
                                </div>
                            </Button>

                            {/* Mina resultat */}
                            <Button
                                variant="outline"
                                className="w-full h-auto p-4 flex items-center justify-start gap-4 border-2 hover:border-blue-600 hover:bg-blue-50/50 transition"
                                onClick={openSelectedGroupResults}
                                disabled={loadingResults}
                            >
                                <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-base">
                                        {loadingResults
                                            ? "Hämtar resultat..."
                                            : "Mina resultat"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Se tidigare provresultat och betyg</div>
                                </div>
                            </Button>
                        </div>

                        {/* AVSKILJARE */}
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-muted"></div>
                            <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-muted-foreground font-medium">eller</span>
                            <div className="flex-grow border-t border-muted"></div>
                        </div>

                        {/* SEKTION 2: INVESTERINGSTÄVLING */}
                        <div className="space-y-3">
                            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase text-left px-1">
                                Tillägg
                            </div>

                            {/* Investeringar & Tävling */}
                            <Button
                                variant="outline"
                                className="w-full h-auto p-4 flex items-center justify-start gap-4 border-2 hover:border-emerald-600 hover:bg-emerald-50/50 transition"
                                onClick={() => setView("investments")}
                            >
                                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-base">Investeringar & Tävling</div>
                                    <div className="text-xs text-muted-foreground">Handla aktier, fonder och se portföljen</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </Main>
        </div>
    );
};

export default StudentDashboard;