import { useState } from "react";
import { useExamAttempt } from "@/hooks/useExamAttempt";
import { usePreventBackButton } from "@/hooks/usePreventBackButton";
import { useDisableContextMenu } from "@/hooks/useDisableContextMenu";
import useExamActivityLogging from "@/hooks/useExamActivityLogging";

import { logEvent } from "@/utils/logEvent";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import UserProfile from "@/components/ui/UserProfile";
import ExamHeader from "./ExamHeader";
import ExamTimer from "./ExamTimer";
import QuestionView from "./QuestionView.jsx";
import ExamNavigation from "./ExamNavigation";

import { Card, CardContent } from "@/components/ui/card";

export default function ExamPage({
    attemptId,
    onExit
}) {

    usePreventBackButton();
    useDisableContextMenu();
    useExamActivityLogging(attemptId);


    const [index, setIndex] = useState(0);

    const {
        attempt,
        questions,
        answers,
        setAnswers,
        saveAnswer,
        loading,
        error
    } = useExamAttempt(attemptId);

    if (loading) {
        return <p>Laddar prov...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!questions.length) {
        return <p>Inga frågor hittades.</p>;
    }

    const current = questions[index];

    const answerConfig =
        typeof current.answer_config === "string"
            ? JSON.parse(current.answer_config)
            : current.answer_config;

    if (!current) {
        return <p>Ingen fråga hittades.</p>;
    }

    const handleTextAnswer = async (questionId, value) => {

        setAnswers(prev => ({
            ...prev,
            [questionId]: value,
        }));

        await saveAnswer(questionId, {
            text_answer: value,
        });
    };

    const handleSingleChoice = async (
        questionId,
        optionId
    ) => {
        console.log("Valt alternativ:", {
            questionId,
            optionId,
        });

        setAnswers(prev => {
            const next = {
                ...prev,
                [questionId]: optionId,
            };

            return next;
        });

        await saveAnswer(questionId, {
            selected_option_ids: [optionId],
        });
    };

    const handleMultiChoice = async (
        questionId,
        optionId
    ) => {
        const currentSelection =
            answers[questionId] || [];

        const updated =
            currentSelection.includes(optionId)
                ? currentSelection.filter(
                    id => id !== optionId
                )
                : [...currentSelection, optionId];

        setAnswers(prev => ({
            ...prev,
            [questionId]: updated,
        }));

        await saveAnswer(questionId, {
            selected_option_ids: updated,
        });
    };

    const next = () => {

        if (index === questions.length - 1) {
            onExit();
            return;
        }

        setIndex(i => i + 1);
    };

    const prev = () => {
        setIndex(i => Math.max(0, i - 1));
    };

    const resetToDefault = async () => {

        const defaultValue =
            current.answer_config?.default_answer;

        if (defaultValue === undefined) {
            return;
        }

        setAnswers(prev => ({
            ...prev,
            [current.id]: defaultValue
        }));

        await saveAnswer(
            current.id,
            {
                text_answer: defaultValue
            }
        );
    };

    const submitExam = async () => {

        await logEvent(
            attemptId,
            "attempt_submitted"
        );

        await fetch(
            `${API_URL}/api/exam-attempts/${attemptId}/submit`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        onExit();
    };

    return (

    <div className="min-h-screen">

        <div className="flex justify-center px-6 py-8">

            <Card className="w-full max-w-4xl">

                <CardContent className="p-8 space-y-6">

                    <UserProfile />

                    <ExamHeader
                        attemptId={attemptId}
                    />

                    <ExamTimer
                        attempt={attempt}
                    />

                    <QuestionView
                        question={current}
                        answer={answers[current.id]}
                        onTextAnswer={handleTextAnswer}
                        onSingleChoice={handleSingleChoice}
                        onMultiChoice={handleMultiChoice}
                    />

                    <ExamNavigation
                        index={index}
                        total={questions.length}
                        allowPrevious={attempt?.allow_go_to_previous_question}
                        //allowPrevious="true"
                        showReset={answerConfig.default_answer !== undefined}
                        onPrev={prev}
                        onNext={next}
                        onReset={resetToDefault}
                        onSubmit={submitExam}
                    />

                </CardContent>

            </Card>

        </div>

    </div>
);
}