import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

export function useExamAttempt(attemptId) {

    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [assessment_answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (!attemptId) {
            return;
        }

        const loadAttempt = async () => {

            try {

                const res = await fetch(
                    `${API_URL}/api/assessment-attempts/${attemptId}`,
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

                const normalizedQuestions =
                    (data.questions || []).map(
                        question => ({

                            ...question,

                            answer_config:
                                typeof question.answer_config === "string"
                                    ? JSON.parse(
                                        question.answer_config
                                    )
                                    : question.answer_config

                        })
                    );

                setQuestions(
                    normalizedQuestions
                );

            } catch (err) {

                setError(err.message);

            } finally {

                setLoading(false);

            }

        };

        loadAttempt();

        const interval =
            setInterval(
                loadAttempt,
                5000
            );

        return () =>
            clearInterval(interval);

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
                `${API_URL}/api/assessment-attempts/${attemptId}`,
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
        assessment_answers,
        setAnswers,
        saveAnswer,
        loading,
        error
    };
}