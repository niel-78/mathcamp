import { useEffect, useState } from "react";
import { renderLatex } from "./utils/renderLatex";
import { isSEB } from "./utils/isSEB";
import { API_URL } from "./config";
import "./styles/exam.css";

export default function ExamPage({ attemptId, onExit }) {
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [time, setTime] = useState(600);
    const [user, setUser] = useState(null);
    const [locked, setLocked] = useState(false);
    const current = questions[index];

    console.log("EXAM PAGE LOAD");
    console.log("ATTEMPT ID:", attemptId);

    useEffect(() => {
        if (!attemptId) return;

        const fetchQuestions = async () => {
            console.log("🔥 FETCH START");

            const res = await fetch(
                `${API_URL}/api/questions?attemptId=${attemptId}`,
                {
                    headers: {
                        Authorization: localStorage.getItem("token")
                    }
                }
            );

            const data = await res.json();
            console.log("🔥 DATA:", data);

            if (!res.ok || !data.questions) {
                alert(data.error || "No questions");
                return;
            }

            setQuestions(data.questions);
        };

        fetchQuestions();
    }, [attemptId]);


    useEffect(() => {
        window.history.pushState(null, "", window.location.href);

        const onPop = () => {
            window.history.pushState(null, "", window.location.href);
        };

        window.addEventListener("popstate", onPop);

        return () => window.removeEventListener("popstate", onPop);
    }, []);


    useEffect(() => {
        const disable = e => e.preventDefault();

        document.addEventListener("contextmenu", disable);

        return () => document.removeEventListener("contextmenu", disable);
    }, []);


    useEffect(() => {
        const handle = () => {
            if (document.hidden) {
                fetch(`${API_URL}/api/events`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: localStorage.getItem("token")
                    },
                    body: JSON.stringify({ type: "tab_switch" })
                });
            }
        };

        document.addEventListener("visibilitychange", handle);

        return () => document.removeEventListener("visibilitychange", handle);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(t => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const handleAnswer = async (optionId) => {
        if (locked) return;
        setLocked(true);

        await fetch(`${API_URL}/api/answers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: localStorage.getItem("token")
            },
            body: JSON.stringify({
                attempt_id: attemptId,
                question_id: current.id,
                option_id: optionId
            }),
        });

        setIndex(i => i + 1);
        setLocked(false);
    };




    if (!questions) {
        return <p>Loading questions...</p>;
    }

    if (questions.length === 0) {
        return <p>Inga frågor hittades</p>;
    }

    if (!current) {
        return <h2>✅ Provet är klart!</h2>;
    }



    console.log("CURRENT:", current);


    return (
        <div className="exam-container">

        {/* SEB warning */}
        {!isSEB() && (
            <div className="warning-text">
            ⚠️ Du kör inte i Safe Exam Browser!
            </div>
        )}

        <h1>Prov</h1>


        <h2>Exam started ✅</h2>
        <p>Attempt: {attemptId}</p>


        <h2>Fråga {index + 1}</h2>

        <div className="question">
            {renderLatex(current.question)}
        </div>


        {/* ✅ visa options */}
        <div className="answers">
            {current.options?.map(opt => (
            <button
                key={opt.id}
                className="answer-btn"
                onClick={() => handleAnswer(opt.id)}
            >
                {renderLatex(opt.text)}
            </button>
        ))}
        </div>

            
    </div>

    );
}
