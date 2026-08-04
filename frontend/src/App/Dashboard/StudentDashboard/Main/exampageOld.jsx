import { useEffect, useState } from "react";
import { renderLatex } from "@/utils/renderLatex";
import MathContent from "@/components/ui/MathContent";
import { isSEB } from "@/utils/isSEB";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";

export default function ExamPage({ attemptId, onExit }) {
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [time, setTime] = useState(0);
    const isDone = index >= questions.length;
    const current = questions[index];

    const allowPrevious = true;    

    useEffect(() => {
        if (!attemptId) return;

        const fetchQuestions = async () => {

            const res = await fetch(
                `${API_URL}/api/exam-attempts/${attemptId}`,
                {
                    headers: authHeaders()
                }
            );

            const data = await res.json();

            if (!res.ok || !data.questions) {
                alert(data.error || "No questions");
                return;
            }
 
            setQuestions(data.questions);

            const initialAnswers = {};

            data.questions.forEach(q => {
                let config =
                    typeof q.answer_config === "string"
                    ? JSON.parse(q.answer_config)
                    : q.answer_config;

                if (config?.default) {
                    initialAnswers[q.id] = config.default;
                }
            });

            setAnswers(initialAnswers);

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
                        ...authHeaders()
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
                ...authHeaders(),
            },
            body: JSON.stringify({
                attempt_id: attemptId,
                question_id: questionId,
                answer: answer
                //selected_option_ids
            })
        });
    };

    const handleInput = (questionId, value) => {
        const question = questions.find(q => q.id === questionId);
        const config =
            typeof question?.answer_config === "string"
            ? JSON.parse(question.answer_config)
            : question?.answer_config;

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

        <Button onClick={() => onExit()}>
            Visa resultat
        </Button>
        </div>
    );
    }

    return (
        <div className="h-screen flex flex-col">

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

            <MathContent value={current.question} />

            {/* ✅ visa options */}
            <div className="answers">

                {/*Visa endast preview för text input som inte är text*/}
                <div className="preview">
                    {current.type !== 1 || current.answer_config.mode === 'text'
                        ? ""
                        : (
                        <MathContent value={answers[current.id]} />
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
                    {(current.shuffledOptions || current.options).map(opt => (
                    <Button
                        key={opt.id}
                        className={answers[current.id] === opt.id ? "selected" : ""}
                        onClick={() => handleSingle(current.id, opt.id)}
                    >
                    <div
                    dangerouslySetInnerHTML={{
                        __html: renderLatex(opt.text)
                    }}
                    />

                    </Button>
                    ))}
                </div>
            )}

            {current.type === 3 && (
            <div className="answers">
                {(current.shuffledOptions || current.options).map(opt => (
                <Button
                    key={opt.id}
                    className={
                        answers[current.id]?.includes(opt.id) ? "selected" : ""
                    }
                    onClick={() => {
                        handleMulti(current.id, opt.id);
                    }}
                >
                    <MathContent value={opt.text} />
                </Button>
                ))}
            </div>
            )}

        </div>

        <div className="nav">
        {!allowPrevious && (          
            <Button onClick={prev} disabled={index === 0}>
                ← Föregående
            </Button>
        )}    

        {current.answer_config?.default && (
        <Button
            onClick={() => {
            setAnswers(prev => ({
                ...prev,
                [current.id]: current.answer_config.default
            }));
            }}
        >
            ↺ Återställ
        </Button>
        )}


        <Button onClick={next}>
            {index === questions.length - 1 ? "Avsluta prov" : "Nästa →"}
        </Button>

        </div>

    </div>

    );
}
