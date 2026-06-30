import { useEffect, useState, useRef } from "react";
import { renderLatex } from "./utils/renderLatex";

import { isMathExpression } from "./utils/isMathExpression";
import { formatValue } from "./utils/formatValue";
import { formatQuestion } from "./utils/formatQuestion";

import { isSEB } from "./utils/isSEB";
import { API_URL } from "./config";
import "./styles/exam.css";

export default function ExamPage({ attemptId, onExit }) {
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [time, setTime] = useState(600);
    const [user, setUser] = useState(null);
    const [locked, setLocked] = useState(false);
    const isDone = index >= questions.length;
    const current = questions[index];

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








    const applyConfig = (value, config) => {
        if (!config) return value;

        let result = value;

        // 🔵 NUMERIC (uttryck)
        if (config.mode === "numeric") {
            result = result.replace(/[^0-9+\-*/^.,()·]/g, "");
        }

        // 🟠 DECIMAL
        if (config.mode === "decimal") {
            result = result.replace(/[^0-9,.-]/g, "");
        }

        // 🟢 LETTERS
        if (config.mode === "letters") {
            result = result.replace(/[^a-zA-ZåäöÅÄÖ ]/g, "");
        }

        // 🟣 ALGEBRA
        if (config.mode === "algebra") {
            result = result.replace(
            /[^a-zA-Z0-9+\-*/^=(){}\[\]_,.·\\ ]/g,
            ""
            );
        }

        if (config.maxLength) {
            result = result.slice(0, config.maxLength);
        }

        return result;
    };






    const saveAnswer = async (questionId, answer) => {

        await fetch(`${API_URL}/api/answers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: localStorage.getItem("token")
            },
            body: JSON.stringify({
                attempt_id: attemptId,
                question_id: questionId,
                answer: answer
            })
        });
    };




    

    const handleInput = (questionId, value) => {
        const question = questions.find(q => q.id === questionId);
        const config =
            typeof question?.math_config === "string"
            ? JSON.parse(question.math_config)
            : question?.math_config;

        const filtered = applyConfig(value, config);

        setAnswers(prev => ({
            ...prev,
            [questionId]: filtered
        }));

        saveAnswer(questionId, filtered);  // ✅ använd rätt värde
    };





    const handleSingle = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));

        saveAnswer(questionId, optionId);
    };



    const handleMulti = (questionId, optionId) => {
        setAnswers(prev => {
            const current = prev[questionId] || [];

            let updated = current.includes(optionId)
            ? current.filter(id => id !== optionId)
            : [...current, optionId];

            // ✅ SANERA: bara numbers
            updated = updated.filter(id => typeof id === "number");

            saveAnswer(questionId, updated);

            return {
            ...prev,
            [questionId]: updated
            };
        });
    };




    const next = () => {
        if (index === questions.length - 1) {
            onExit();   // ✅ GÅ TILL DASHBOARD
        } else {
            setIndex(i => i + 1);
        }
    };

    const prev = () => setIndex(i => Math.max(i - 1, 0));

    if (!questions) {
        return <p>Loading questions...</p>;
    }

    if (questions.length === 0) {
        return <p>Inga frågor hittades</p>;
    }


    if (isDone) {
    return (
        <div>
        <h2>✅ Det var sista frågan!</h2>

        <button onClick={() => onExit()}>
            Visa resultat
        </button>
        </div>
    );
    }



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




        <div
            dangerouslySetInnerHTML={{
                __html: formatQuestion(current.question)
            }}
        />





        {/* ✅ visa options */}
        <div className="answers">




            <div className="preview">
                {current.math_config?.mode === "text"
                    ? answers[current.id] || ""
                    : (
                    <span
                        dangerouslySetInnerHTML={{
                        __html: formatValue(answers[current.id])
                        }}
                    />
                    )
                }
            </div>



            {current.type === 1 && (
                <input
                    type="text"
                    value={answers[current.id] || ""}
                    onChange={(e) => handleInput(current.id, e.target.value)}
                    className="answer-input"
                />
            )}
            

            {current.type === 2 && (
            <div className="answers">
                {current.options.map(opt => (
                <button
                    key={opt.id}
                    className={answers[current.id] === opt.id ? "selected" : ""}
                    onClick={() => handleSingle(current.id, opt.id)}
                >
                <div
                dangerouslySetInnerHTML={{
                    __html: renderLatex(opt.text)
                }}
                />

                </button>
                ))}
            </div>
            )}

            {current.type === 3 && (
            <div className="answers">
                {current.options.map(opt => (
                <button
                    key={opt.id}
                    className={
                        answers[current.id]?.includes(opt.id) ? "selected" : ""
                    }
                    onClick={() => {
                        handleMulti(current.id, opt.id);
                    }}
                >

                    <div
                    dangerouslySetInnerHTML={{
                        __html: formatValue(opt.text)
                    }}
                    />

                </button>
                ))}
            </div>
            )}

        </div>

        <div className="nav">
        <button onClick={prev} disabled={index === 0}>
            ← Föregående
        </button>


        <button onClick={next}>
            {index === questions.length - 1 ? "Avsluta prov" : "Nästa →"}
        </button>

        </div>


        <p>
        ⏳ Tid: {Math.floor(time / 60)}:
        {String(time % 60).padStart(2, "0")}
        </p>


    </div>

    );
}
