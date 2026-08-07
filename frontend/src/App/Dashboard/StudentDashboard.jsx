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

const StudentDashboard = () => {
  const [examKey, setExamKey] = useState("");
  const [attemptId, setAttemptId] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [view, setView] = useState("start");
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);


  const startExam = async () => {
    const res = await fetch(`${API_URL}/api/exam-attempts/start`, {
      method: "POST",
      headers: {
          ...authHeaders(),
          "Content-Type": "application/json"
      },
      body: JSON.stringify( {group_exam_key: examKey })
    });

    const data = await res.json();

    if (!res.ok) {

        setErrorMessage(data.error);

        setErrorOpen(true);

        return;
    }

    setAttemptId(data.attempt_id);
    setExamConfig(data.exam_config);
    setView("exam");
  };

  if (view === "exam") {
    return (
      <ExamPage
        attemptId={attemptId}
        examConfig={examConfig}
        onExit={() => setView("result")}
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

                  <Label className="mt-2 text-muted-foreground" htmlFor="examKey">
                      Ange provnyckel för att starta provet.
                  </Label>
                  
                  <Input
                    placeholder=""
                    value={examKey}
                    id="examKey"
                    onChange={(e) => setExamKey(e.target.value)}
                  />
                  

                  <Button onClick={startExam}>
                      Start Exam
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