import { useState } from "react";
import ExamPage from "./ExamPage"
import Login from "./Login";
import { API_URL } from "./config";

export default function App() {
  const [user, setUser] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [examKey, setExamKey] = useState("");


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

  // ✅ visa exam (sen bygger vi den)

  if (attemptId) {
    return (
      <ExamPage
        attemptId={attemptId}
        onExit={logout}
      />
    );
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

