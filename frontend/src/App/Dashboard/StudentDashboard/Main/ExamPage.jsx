import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useExamAttempt } from "@/hooks/useExamAttempt";
import { usePreventBackButton } from "@/hooks/usePreventBackButton";
import { useDisableContextMenu } from "@/hooks/useDisableContextMenu";
import useExamActivityLogging from "@/hooks/useExamActivityLogging";

import { logEvent } from "@/utils/logEvent";

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
    onExit,
    onLocked
}) {

    usePreventBackButton();
    useDisableContextMenu();
    useExamActivityLogging(attemptId);

    const [index, setIndex] = useState(0);


    const [dynamicQuestions, setDynamicQuestions] =
        useState([]);

    const {
        attempt,
        questions,
        assessment_answers,
        setAnswers,
        saveAnswer,
        loading,
        error
    } = useExamAttempt(attemptId);

    useEffect(() => {

        setDynamicQuestions(
            questions || []
        );

    }, [questions]);

    useEffect(() => {

        if (!attempt) {
            return;
        }

        if (attempt.status === "locked") {

            toast.error(
                "Provet har låsts."
            );

            onLocked();
            return;

        }

        if (attempt.status === "submitted") {

            toast.error(
                "Provet har avslutats av läraren."
            );

            onExit();

        }

    }, [
        attempt,
        onExit,
        onLocked
    ]);

    if (loading) {
        return <p>Laddar prov...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!dynamicQuestions.length) {
        return <p>Inga frågor hittades.</p>;
    }

    const current =
        dynamicQuestions[index];

    if (!current) {
        return <p>Ingen fråga hittades.</p>;
    }

    const answerConfig =
        typeof current.answer_config === "string"
            ? JSON.parse(current.answer_config)
            : current.answer_config || {};

    const attemptConfig =
        typeof attempt?.config === "string"
            ? JSON.parse(attempt.config)
            : attempt?.config || {};

    const isDiagnostic =
        attempt?.assessment?.type ===
        "diagnostic";

    const isAdaptive =
        attempt?.assessment?.config?.mode ===
        "adaptive";


    const appendNextQuestion = (
        result
    ) => {

        if (result?.nextQuestion) {

            setDynamicQuestions(prev => {

                const exists =
                    prev.some(
                        q =>
                            q.id ===
                            result.nextQuestion.id
                    );

                if (exists) {
                    return prev;
                }

                return [
                    ...prev,
                    result.nextQuestion
                ];

            });

        }

        if (
            typeof result?.correct ===
            "boolean"
        ) {

            if (result.correct) {

                toast.success(
                    "Rätt!"
                );

            } else {

                toast.error(
                    "Fel"
                );

            }

        }

    };

    const handleTextAnswer =
        async (
            questionId,
            value
        ) => {

            setAnswers(prev => ({
                ...prev,
                [questionId]: value
            }));

            const result =
                await saveAnswer(
                    questionId,
                    {
                        text_answer: value
                    }
                );

            appendNextQuestion(result);

            if (
                isAdaptive &&
                result?.nextQuestion
            ) {
                setIndex(current =>
                    current + 1
                );
            }

        };

    const handleSingleChoice =
        async (
            questionId,
            optionId
        ) => {

            setAnswers(prev => ({
                ...prev,
                [questionId]: optionId
            }));

            const result =
                await saveAnswer(
                    questionId,
                    {
                        selected_option_ids: [
                            optionId
                        ]
                    }
                );

            appendNextQuestion(result);

            if (
                isAdaptive &&
                result?.nextQuestion
            ) {
                setIndex(current =>
                    current + 1
                );
            }


        };

    const handleMultiChoice =
        async (
            questionId,
            optionId
        ) => {

            const currentSelection =
                assessment_answers[
                    questionId
                ] || [];

            const updated =
                currentSelection.includes(
                    optionId
                )
                    ? currentSelection.filter(
                        id =>
                            id !== optionId
                    )
                    : [
                        ...currentSelection,
                        optionId
                    ];

            setAnswers(prev => ({
                ...prev,
                [questionId]: updated
            }));

            const result =
                await saveAnswer(
                    questionId,
                    {
                        selected_option_ids:
                            updated
                    }
                );

            appendNextQuestion(result);

            if (
                isAdaptive &&
                result?.nextQuestion
            ) {
                setIndex(current =>
                    current + 1
                );
            }


        };

    const next = () => {

        if (
            index <
            dynamicQuestions.length - 1
        ) {

            setIndex(
                current =>
                    current + 1
            );

        }

    };

    const prev = () => {

        setIndex(current =>
            Math.max(
                0,
                current - 1
            )
        );

    };

    const resetToDefault =
        async () => {

            const defaultValue =
                answerConfig.default_answer;

            if (
                defaultValue ===
                undefined
            ) {
                return;
            }

            setAnswers(prev => ({
                ...prev,
                [current.id]:
                    defaultValue
            }));

            await saveAnswer(
                current.id,
                {
                    text_answer:
                        defaultValue
                }
            );

        };

    const submitExam =
        async () => {

            await logEvent(
                attemptId,
                "attempt_submitted"
            );

            await fetch(
                `${API_URL}/api/assessment-attempts/${attemptId}/submit`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
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
                            attemptId={
                                attemptId
                            }
                        />

                        <ExamTimer
                            attempt={attempt}
                        />

                        <QuestionView
                            question={current}
                            answer={
                                assessment_answers[
                                    current.id
                                ]
                            }
                            onTextAnswer={
                                handleTextAnswer
                            }
                            onSingleChoice={
                                handleSingleChoice
                            }
                            onMultiChoice={
                                handleMultiChoice
                            }
                        />

                        <ExamNavigation
                            index={index}
                            total={
                                dynamicQuestions.length
                            }
                            allowPrevious={
                                !isDiagnostic &&
                                attempt?.allow_go_to_previous_question
                            }
                            showReset={
                                answerConfig.default_answer !==
                                undefined
                            }
                            onPrev={prev}
                            onNext={next}
                            onReset={
                                resetToDefault
                            }
                            onSubmit={
                                submitExam
                            }
                        />

                    </CardContent>

                </Card>

            </div>

        </div>
    );

}