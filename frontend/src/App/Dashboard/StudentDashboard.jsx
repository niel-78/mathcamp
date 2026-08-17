import { useState } from "react";
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
import { toast } from "sonner";
import { logEvent } from "@/utils/logEvent";

const StudentDashboard = () => {
    const [assessmentKey, setExamKey] = useState("");
    const [attemptId, setAttemptId] = useState(null);
    const [assessmentConfig, setExamConfig] = useState(null);
    const [view, setView] = useState("start");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorOpen, setErrorOpen] = useState(false);

    const [groupExam, setGroupExam] = useState(null);

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
                    group_assessment_id:
                        groupExam.group_assessment_id
                })
            }
        );

        const data = await res.json();

        const navigation =
            performance
                .getEntriesByType(
                    "navigation"
                )[0];

        if (
            data.resume &&
            navigation?.type === "reload"
        ) {

            logEvent(
                data.attempt_id,
                "page_refresh"
            );

        }

        if (!res.ok) {

            setErrorMessage(data.error);
            setErrorOpen(true);

            return;
        }

        if (data.status === "locked") {

            setAttemptId(
                data.attempt_id
            );

            setView(
                "locked"
            );

            return;

        }

        setAttemptId(data.attempt_id);
        setExamConfig(data.config);

        if (data.status === "locked") {

            setAttemptId(
                data.attempt_id
            );

            setView(
                "locked"
            );

            return;

        }

        if (
            data.resume &&
            data.status !== "locked"
        ) {

            toast.info(
                "Du återupptar ett pågående prov."
            );

        }

        setView("assessment");
    };


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
            onUnlocked={() =>
                setView("assessment")
            }
        />

        );

    }

    if (view === "result") {
        return <ResultPage attemptId={attemptId} />;
    }


    return (
        <>
        <div className="h-screen flex flex-col">

            <Header />

            <Main>

                <div
                    className="
                        w-full
                        max-w-md
                        rounded-xl
                        border
                        bg-white
                        p-6
                        shadow-sm
                    "
                >
                    <h2 className="text-2xl font-bold">
                        Starta prov
                    </h2>

                    <Label className="mt-2 text-muted-foreground" htmlFor="assessmentKey">
                        Ange provnyckel för att starta provet.
                    </Label>
                    
                    <Input
                        placeholder=""
                        value={assessmentKey}
                        id="assessmentKey"
                        onChange={(e) => setExamKey(e.target.value)}
                    />
                    
                    <Button onClick={findExam}>
                        Anslut
                    </Button>

                </div>

            </Main>

        </div>
        <StartExamErrorDialog
            open={errorOpen}
            onOpenChange={setErrorOpen}
            message={errorMessage}
        />
    </>
            
    );
    }  

    export default StudentDashboard;