import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { useAuth } from "@/contexts/AuthContext";
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
import PlanningBoard from "@/components/planning/PlanningBoard";
import { toast } from "sonner";
import { logEvent } from "@/utils/logEvent";
import { resolveFormulaSheetGroup } from "@/utils/formulaSheetGroup";
import { activeExamSessionStorageKey } from "@/hooks/useAutoLogout";
import {
    KeyRound,
    Trophy,
    ClipboardList,
    CalendarDays,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Minus
} from "lucide-react";

const StudentDashboard = () => {
    const { logout } = useAuth();
    const [assessmentKey, setExamKey] = useState("");
    const [attemptId, setAttemptId] = useState(null);
    const [assessmentConfig, setExamConfig] = useState(null);
    const [view, setView] = useState("start");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorOpen, setErrorOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [loadingResults, setLoadingResults] = useState(false);
    const [loadingPlanning, setLoadingPlanning] = useState(false);
    const [planningLessons, setPlanningLessons] = useState([]);
    const [resultAttempts, setResultAttempts] = useState([]);
    const [resultAbilities, setResultAbilities] = useState([]);
    const [resultTab, setResultTab] = useState("results");

    const [groupExam, setGroupExam] = useState(null);

    const formulaGroup = resolveFormulaSheetGroup({
        groups,
        selectedGroupId,
        groupExam
    });

    useEffect(() => {

        if (["waiting-room", "assessment", "locked"].includes(view)) {
            sessionStorage.setItem(activeExamSessionStorageKey, "true");
            return;
        }

        sessionStorage.removeItem(activeExamSessionStorageKey);

    }, [view]);

    useEffect(() => () => {
        sessionStorage.removeItem(activeExamSessionStorageKey);
    }, []);

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
            setSelectedGroupId(data[0]?.id ? String(data[0].id) : "");

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
            setErrorMessage(data.error || "Kunde inte hitta provtillfället.");
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
        if (data.group_id) {
            setSelectedGroupId(String(data.group_id));
        }
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

        if (res.status === 401) {
            await logout();
            return;
        }

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

            const attemptsResponse = await fetch(
                `${API_URL}/api/students/me/groups/${selectedGroupId}/attempts`,
                {
                    headers: authHeaders()
                }
            );
            const attemptsData = await attemptsResponse.json();
            const selectedAttemptId = attemptsData[0]?.id;
            const abilitiesQuery = selectedAttemptId
                ? `?attemptId=${selectedAttemptId}`
                : "";
            const abilitiesResponse = await fetch(
                `${API_URL}/api/students/me/groups/${selectedGroupId}/abilities${abilitiesQuery}`,
                {
                    headers: authHeaders()
                }
            );
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

    const loadPlanningLessons = async () => {
        if (!selectedGroupId) return;
        try {
            const response = await fetch(
                `${API_URL}/api/lessons?groupIds=${selectedGroupId}`,
                {
                    headers: authHeaders()
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPlanningLessons(data);
            }
        } catch (err) {
            console.error("Kunde inte uppdatera planering:", err);
        }
    };

    const openSelectedGroupPlanning = async () => {
        if (!selectedGroupId) {
            setErrorMessage(
                "Välj en grupp först."
            );
            setErrorOpen(true);
            return;
        }

        setLoadingPlanning(true);

        try {
            const response = await fetch(
                `${API_URL}/api/lessons?groupIds=${selectedGroupId}`,
                {
                    headers: authHeaders()
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || "Kunde inte hämta planering.");
                setErrorOpen(true);
                return;
            }

            setPlanningLessons(data);
            setView("planning");
        } catch (err) {
            setErrorMessage("Kunde inte hämta planering.");
            setErrorOpen(true);
        } finally {
            setLoadingPlanning(false);
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
                formulaGroup={formulaGroup}
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

    if (view === "planning") {
        const selectedGroup = groups.find(
            g => String(g.id) === String(selectedGroupId)
        );

        return (
            <div className="flex h-[100dvh] min-h-0 min-w-0 flex-col">
                <Header groups={groups} />
                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background p-3 text-foreground sm:p-6">
                    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setView("start")}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" /> Tillbaka till start
                            </Button>

                            {selectedGroup && (
                                <div className="text-sm font-medium text-muted-foreground">
                                    Grupp: <span className="font-semibold text-foreground">{selectedGroup.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                            <h2 className="text-2xl font-bold">
                                Gruppens planering
                            </h2>

                            <PlanningBoard
                                groupId={selectedGroupId}
                                lessons={planningLessons}
                                loading={loadingPlanning}
                                onReload={loadPlanningLessons}
                                readOnly={true}
                            />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (view === "result") {
        return (
            <div className="flex h-[100dvh] min-w-0 flex-col">
                <Header groups={groups} />
                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background p-3 text-foreground sm:p-6">
                    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-4">
                        <Button variant="ghost" onClick={() => setView("start")} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Tillbaka till start
                        </Button>

                        <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2 shadow-sm">
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
                            <div className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
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
                            <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
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
                                            className="flex min-w-0 flex-wrap items-start justify-between gap-4 rounded-lg border px-4 py-3"
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
                    </div>
                </main>
            </div>
        );
    }

    if (view === "investments") {
        return (
            <div className="flex h-[100dvh] min-h-0 min-w-0 flex-col">
                <Header groups={groups} />
                <div className="flex shrink-0 flex-col items-start border-b bg-muted/20 p-3 sm:p-4">
                    <Button variant="ghost" onClick={() => setView("start")} className="gap-2 text-xs">
                        <ArrowLeft className="h-4 w-4" /> Tillbaka till huvudmeny
                    </Button>
                </div>
                <div className="min-h-0 min-w-0 flex-1 overflow-auto">
                    <CompetitionTab
                        groupId={selectedGroupId}
                    /> 
                </div>
            </div>
        );
    }

    if (view === "key-entry") {
        return (
            <div className="flex h-[100dvh] min-h-0 min-w-0 flex-col">
                <Header groups={groups} />
                <Main>
                    <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                        <Button variant="ghost" onClick={() => setView("start")} className="gap-2 -ml-2 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Tillbaka
                        </Button>
                        
                        <h2 className="text-2xl font-bold">Starta prov</h2>
                        <Label className="text-muted-foreground" htmlFor="assessmentKey">
                            Ange provnyckel för att starta provet.
                        </Label>
                        
                        <Input
                            placeholder="T.ex 112233"
                            value={assessmentKey}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            id="assessmentKey"
                            onChange={(e) => setExamKey(e.target.value.replace(/\D/g, ""))}
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
        <div className="flex h-[100dvh] min-h-0 min-w-0 flex-col">
            <Header groups={groups} />

            <Main>
            <div className="w-full max-w-lg space-y-6 rounded-xl border bg-white p-4 text-center shadow-sm sm:p-8">
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
                                className="h-auto w-full items-start justify-start gap-3 border-2 p-3 transition hover:border-primary hover:bg-primary/5 sm:items-center sm:gap-4 sm:p-4"
                                onClick={() => setView("key-entry")}
                            >
                                <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary sm:p-3">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 text-left break-words">
                                    <div className="font-bold text-base">Skriv prov</div>
                                    <div className="text-xs text-muted-foreground">Anslut med provnyckel från din lärare</div>
                                </div>
                            </Button>

                            {/* Mina resultat */}
                            <Button
                                variant="outline"
                                className="h-auto w-full items-start justify-start gap-3 border-2 p-3 transition hover:border-blue-500/80 hover:bg-blue-500/5 sm:items-center sm:gap-4 sm:p-4"
                                onClick={openSelectedGroupResults}
                                disabled={loadingResults}
                            >
                                <div className="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-600 sm:p-3 dark:text-blue-400">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 text-left break-words">
                                    <div className="font-bold text-base">
                                        {loadingResults
                                            ? "Hämtar resultat..."
                                            : "Mina resultat"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Se tidigare provresultat och betyg</div>
                                </div>
                            </Button>

                            {/* Gruppens planering */}
                            <Button
                                variant="outline"
                                className="h-auto w-full items-start justify-start gap-3 border-2 p-3 transition hover:border-amber-500/80 hover:bg-amber-500/5 sm:items-center sm:gap-4 sm:p-4"
                                onClick={openSelectedGroupPlanning}
                                disabled={loadingPlanning}
                            >
                                <div className="shrink-0 rounded-lg bg-amber-500/10 p-2 text-amber-600 sm:p-3 dark:text-amber-400">
                                    <CalendarDays className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 text-left break-words">
                                    <div className="font-bold text-base">
                                        {loadingPlanning
                                            ? "Hämtar planering..."
                                            : "Gruppens planering"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Se lektioner, tider och planering</div>
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
                                className="h-auto w-full items-start justify-start gap-3 border-2 p-3 transition hover:border-emerald-500/80 hover:bg-emerald-500/5 sm:items-center sm:gap-4 sm:p-4"
                                onClick={() => setView("investments")}
                            >
                                <div className="shrink-0 rounded-lg bg-emerald-500/10 p-2 text-emerald-600 sm:p-3 dark:text-emerald-400">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 text-left break-words">
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