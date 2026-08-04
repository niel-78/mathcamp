import { useState } from "react";

import { useExamAttempt } from "@/hooks/useExamAttempt";

import { usePreventBackButton } from "@/hooks/usePreventBackButton";
import { useDisableContextMenu } from "@/hooks/useDisableContextMenu";
import { useTabSwitchDetection } from "@/hooks/useTabSwitchDetection";

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
    useTabSwitchDetection();

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

            console.log("NEW ANSWERS", next);

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

    console.log("ExamPage answer", answers[current.id]);

    

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
                        //allowPrevious={attempt?.allow_previous}
                        allowPrevious="true"
                        onPrev={prev}
                        onNext={next}
                    />

                </CardContent>

            </Card>

        </div>

    </div>
);
}