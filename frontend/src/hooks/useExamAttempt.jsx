import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

export function useExamAttempt(attemptId) {
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [assessment_answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const unauthorizedRef = useRef(false);

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

                if (res.status === 401) {
                    unauthorizedRef.current = true;
                    setError("Sessionen har gått ut. Logga in igen.");
                    return;
                }

                if (!res.ok) {
                    throw new Error(
                        data.error ||
                        "Kunde inte ladda provet"
                    );
                }

                setAttempt(data.attempt);
                const restoredAnswers = Object.fromEntries(
                    Object.entries(data.answers || {}).map(([questionId, answer]) => [
                        questionId,
                        answer.text_answer !== null && answer.text_answer !== undefined
                            ? answer.text_answer
                            : answer.selected_option_ids
                    ])
                );
                setAnswers(restoredAnswers);

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

        const checkStatus = async () => {

            if (unauthorizedRef.current) {
                return;
            }

            try {

                const response =
                    await fetch(
                        `${API_URL}/api/assessment-attempts/${attemptId}/status`,
                        {
                            headers: authHeaders()
                        }
                    );

                if (response.status === 401) {
                    unauthorizedRef.current = true;
                    toast.error("Kunde inte verifiera sessionen. Försök spara igen om en stund.");
                    return;
                }

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

            setAttempt(prev => {

                if (!prev) {
                    return prev;
                }

                return {
                    ...prev,
                    status: data.status,
                    submitted_at: data.submitted_at,
                    teacher_end_mode: data.teacher_end_mode,
                    config: data.config
                };

            });

            } catch (error) {

                console.error(error);

            }

        };

        const interval =
            setInterval(
                checkStatus,
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

            const data =
                await res.json();

            if (res.status === 401) {
                unauthorizedRef.current = true;
                toast.error("Kunde inte verifiera sessionen. Svaret sparades inte.");
                return null;
            }

            if (!res.ok) {

                toast.error(
                    data.error ||
                    "Kunde inte spara svar"
                );

                return null;

            }

            return data;

        } catch (err) {

            console.error(err);

            toast.error(
                "Nätverksfel vid sparning"
            );

            return null;

        }

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