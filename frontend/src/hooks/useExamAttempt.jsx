import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

export function useExamAttempt(attemptId) {

    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (!attemptId) return;

        const loadAttempt = async () => {

            try {

                setLoading(true);

                const res = await fetch(
                    `${API_URL}/api/exam-attempts/${attemptId}`,
                    {
                        headers: authHeaders()
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data.error ||
                        "Kunde inte ladda provet"
                    );
                }

                setAttempt(data.attempt);
                setQuestions(data.questions || []);

                const answerMap = {};

                data.questions?.forEach(question => {

                    /*
                     * Svar från backend
                     */
                    if (question.answer) {

                        answerMap[question.id] =
                            question.answer;
                    }

                    /*
                     * Defaultvärde
                     */
                    else {

                        const config =
                            typeof question.math_config === "string"
                                ? JSON.parse(question.math_config)
                                : question.math_config;

                        if (config?.default) {
                            answerMap[question.id] =
                                config.default;
                        }
                    }
                });

                setAnswers(answerMap);

                    toast.success("Hämtar ditt prov...");

                } catch (err) {

                    setError(err.message);

                    toast.error(
                        err.message ||
                        "Kunde inte ladda provet"
                    );

                } finally {

                setLoading(false);

            }
        };

        loadAttempt();

    }, [attemptId]);

    const saveAnswer = async (
        questionId,
        {
            text_answer = null,
            selected_option_ids = []
        }
    ) => {

        try {

            const res = await fetch(
                `${API_URL}/api/exam-attempts/${attemptId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        question_id: questionId,
                        text_answer,
                        selected_option_ids
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {

                toast.error(
                    data.error ||
                    "Kunde inte spara svar"
                );

                return;
            }

        } catch (err) {

            console.error(err);

            toast.error(
                "Nätverksfel vid sparning"
            );
        }

        toast.success("Sparar...");

    };

    return {
        attempt,
        questions,
        answers,
        setAnswers,
        saveAnswer,
        loading,
        error
    };
}