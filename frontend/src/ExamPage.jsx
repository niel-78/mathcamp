import { useEffect, useState } from "react";
import { renderLatex } from "./utils/renderLatex";
import { isSEB } from "./utils/isSEB";
import "./styles/exam.css";

export default function ExamPage() {
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [time, setTime] = useState(600);

    const current = questions[index];

    useEffect(() => {
        fetch("http://192.168.1.115:3000/api/questions")
        .then(res => res.json())
        .then(data => setQuestions(data));
    }, []);


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
                fetch("/api/events", {
                    method: "POST",
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


    // ✅ när användaren klickar
    const handleAnswer = async (answer) => {
        await fetch("/api/answers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            exam_id: 1,
            question_id: current.id,
            answer
        })
        });

        // gå till nästa fråga
        setIndex(i => i + 1);
    };

    if (!current) return <h2>Klart!</h2>;


    return (
        <div className="exam-container">

        {/* SEB warning */}
        {!isSEB() && (
            <div className="warning-text">
            ⚠️ Du kör inte i Safe Exam Browser!
            </div>
        )}

        <h1>Prov</h1>

        <h2>Fråga {index + 1}</h2>

        <div className="question">
            {renderLatex(current.question)}
        </div>


        {/* ✅ visa options */}
        <div className="answers">
            {current.options.map(opt => (
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
