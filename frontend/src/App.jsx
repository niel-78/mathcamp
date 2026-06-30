import { useState } from "react";
import ExamPage from "./ExamPage";
import Dashboard from "./Dashboard";
import Login from "./Login";
import { API_URL } from "./config";

export default function App() {
  const [user, setUser] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [examKey, setExamKey] = useState("");
  const [view, setView] = useState("start");

  console.log("VIEW:", view);

  const startExam = async () => {
    const res = await fetch(`${API_URL}/api/start-exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token")
      },
      body: JSON.stringify({ examKey })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setAttemptId(data.attemptId);
    setView("exam")
  };


  const getResults = async () => {
    const res = await fetch(`${API_URL}/api/result?attemptId=${attemptId}`);
    const data = await res.json();

    console.log(data.results);
  };



  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAttemptId(null);
  };

  // ✅ visa login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (!user) {
    return <Login />;
  }

  if (view === "exam") {
    return (
      <ExamPage
        attemptId={attemptId}
        onExit={() => setView("dashboard")}
      />
    );
  }

  if (view === "dashboard") {
    return <Dashboard attemptId={attemptId} />;
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

