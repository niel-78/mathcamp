import { useEffect, useState } from "react";
import { API_URL } from "./config";
import { renderLatex } from "./utils/renderLatex";
import { formatValue } from "./utils/formatValue";

const Dashboard = ({ attemptId }) => {
  const [results, setResults] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const loadResults = async () => {

      const res = await fetch(
        `${API_URL}/api/result?attemptId=${attemptId}`
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("ERROR:", text);
        return;
      }

      const data = await res.json();

      const results = data.results || [];

      setResults(results);

      const correctCount = results.filter(r => r.correct).length;
      setScore(correctCount);
    };

    if (attemptId) {
      loadResults();   // ✅ kalla funktionen
    }

  }, [attemptId]);


  return (
    <div>
      <h1>Dashboard</h1>

      <h2>
        Poäng: {score} / {results.length}
      </h2>

      {results.map(r => (
        <div
          key={r.question_id}
          style={{
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            background: r.correct ? "#d4edda" : "#f8d7da"
          }}
        >
          <h4>Fråga {r.question_id}</h4>

          <div>
            {r.correct ? "✅ Rätt" : "❌ Fel"}
          </div>

          {/* ✅ TEXT (type 1) */}
          {r.type === 1 && (
            <div>

              <strong>Ditt svar:</strong>
              <div
                dangerouslySetInnerHTML={{
                  __html: formatValue(r.userText)
                }}
              />

              <strong>Rätt svar:</strong>
              <div
                dangerouslySetInnerHTML={{
                  __html: formatValue(r.correctText)
                }}
              />


            </div>
          )}

          {/* ✅ SINGLE & MULTI (type 2 & 3) */}
          {(r.type === 2 || r.type === 3) && (
            <div>
              {r.options.map(opt => {
                const isUser = r.userOptions.includes(opt.id);
                const isCorrect = r.correctOptions.includes(opt.id);

                return (
                  <div
                    key={opt.id}
                    style={{
                      padding: "5px",
                      marginTop: "5px",
                      background:
                        isCorrect
                          ? "#c3f3c3"
                          : isUser
                          ? "#f8c6c6"
                          : "transparent"
                    }}
                  >
                    <span>
                      {isCorrect ? "✅" : isUser ? "❌" : ""}{" "}
                    </span>


                    <span
                      dangerouslySetInnerHTML={{
                        __html: formatValue(opt.text)
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}  
    

    </div>
  );
}  

export default Dashboard;