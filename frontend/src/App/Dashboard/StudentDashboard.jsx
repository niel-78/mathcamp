import { useState } from "react";
import { API_URL } from "../../config";
import { useAuth } from "../../Contexts/AuthContext";
import { authHeaders } from "../../api/authHeaders";
import ExamPage from "./StudentDashboard/ExamPage";
import ResultPage from "./StudentDashboard/ResultPage";

const StudentDashboard = () => {
  const [examKey, setExamKey] = useState("");
  const { user, logout } = useAuth();
  const [attemptId, setAttemptId] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [view, setView] = useState("start");

  const startExam = async () => {
    const res = await fetch(`${API_URL}/api/start-exam`, {
      method: "POST",
      headers: {
          ...authHeaders(),
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ examKey })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setAttemptId(data.attemptId);
    setExamConfig(data.exam.examConfig);
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
    console.log(attemptId);
    return <ResultPage attemptId={attemptId} />;
  }


  return (
    <div>
      <h1>Welcome {user.username}</h1>

      <input
        placeholder="Enter exam key"
        value={examKey}
        onChange={(e) => setExamKey(e.target.value)}
      />

      <button onClick={startExam}>
        Start Exam
      </button>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}  

export default StudentDashboard;