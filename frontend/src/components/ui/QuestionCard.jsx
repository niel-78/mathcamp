import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import DetailLayout
    from "@/components/layouts/DetailLayout";

import MathContent
    from "@/components/ui/MathContent";

import OptionList
    from "@/components/ui/OptionList";

import { gradeAnswer } from "@/utils/grading/gradeAnswer";
import { scoreNumericInput } from "@/utils/grading/gradeNumericInput";

import AnswerConfigEditor
    from "@/components/ui/AnswerConfigEditor";

import DeleteMediaDialog
    from "@/components/ui/DeleteMediaDialog";

import QuestionView
    from "@/App/Dashboard/StudentDashboard/Main/QuestionView";

import {
    QUESTION_TYPES
} from "@/constants/assessmentConstants";

function getNumericDefaultAnswer(question) {

    const answerConfig =
        typeof question.answer_config === "string"
            ? (() => {
                try {
                    return JSON.parse(question.answer_config);
                } catch {
                    return {};
                }
            })()
            : question.answer_config;

    if (
        question.question_type !== "numeric_input" ||
        question.options?.length > 0 ||
        answerConfig?.default_answer === undefined ||
        answerConfig.default_answer === ""
    ) {
        return null;
    }

    return answerConfig.default_answer;
}

export default function QuestionCard({
    question,
    onChanged
}) {

    if (!question) {
        return null;
    }

    const [mediaToDelete,
        setMediaToDelete] =
        useState(null);

    const [questionText,
        setQuestionText] =
        useState(question.question);

    const [editingQuestion,
        setEditingQuestion] =
        useState(false);

    const [savingQuestion,
        setSavingQuestion] =
        useState(false);

    const [levels, setLevels] =
        useState([]);

    const [levelId,
        setLevelId] =
        useState(
            question.level_id ?? 2
        );

    const [previewAnswer,
        setPreviewAnswer] =
        useState(
            question.question_type === "multiple_choice"
                ? []
                : ""
        );

    const handlePreviewTextAnswer =
        (_questionId, value) =>
            setPreviewAnswer(value);

    const handlePreviewSingleChoice =
        (_questionId, optionId) =>
            setPreviewAnswer(optionId);

    const handlePreviewMultiChoice =
        (_questionId, optionId) =>
            setPreviewAnswer(previous => {

                const current = previous || [];

                return current.includes(optionId)
                    ? current.filter(id => id !== optionId)
                    : [...current, optionId];

            });

    const correctOptions =
        question.options?.filter(option => option.is_correct) || [];

    const hasPreviewAnswer =
        question.question_type === "multiple_choice"
            ? Array.isArray(previewAnswer) && previewAnswer.length > 0
            : question.question_type === "numeric_input"
                ? (() => {

                    try {
                        return (JSON.parse(previewAnswer || "[]") || [])
                            .some(value => (value ?? "").toString().trim() !== "");
                    } catch (error) {
                        return false;
                    }

                })()
                : previewAnswer !== "" && previewAnswer != null;

    const previewResult = (() => {

        if (!hasPreviewAnswer) {
            return null;
        }

        const config =
            typeof question.answer_config === "string"
                ? JSON.parse(question.answer_config || "{}")
                : question.answer_config || {};

        if (question.question_type === "numeric_input") {

            const score = scoreNumericInput(
                previewAnswer,
                correctOptions.map(option => option.text),
                config
            );

            return {
                correct: score.correct,
                pointsFraction: score.pointsFraction
            };

        }

        if (question.question_type === "text") {

            const correct = gradeAnswer({
                studentAnswer: previewAnswer,
                correctAnswer: correctOptions[0]?.text,
                config
            });

            return { correct, pointsFraction: correct ? 1 : 0 };

        }

        const selectedIds =
            Array.isArray(previewAnswer)
                ? [...previewAnswer].sort()
                : [previewAnswer];

        const correctIds =
            correctOptions.map(option => option.id).sort();

        const correct =
            JSON.stringify(selectedIds) === JSON.stringify(correctIds);

        return { correct, pointsFraction: correct ? 1 : 0 };

    })();

    const saveQuestion =
        async (overrides = {}) => {

            setSavingQuestion(true);

            try {

                const response = await fetch(
                    `${API_URL}/api/questions/${question.id}`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            question: questionText,
                            question_type: question.question_type,
                            answer_config: question.answer_config,
                            level_id: question.level_id,
                            ...overrides
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Kunde inte spara frågan."
                    );
                }

                await onChanged?.();

                return true;

            } catch (error) {

                toast.error(error.message);

                return false;

            } finally {

                setSavingQuestion(false);

            }

        };

    const saveQuestionText =
        async () => {

            const saved =
                await saveQuestion();

            if (saved) {

                setEditingQuestion(false);

                toast.success(
                    "Frågetext sparad"
                );

            }

        };

    const changeQuestionType =
        async (newType) => {

            const saved =
                await saveQuestion({
                    question_type: newType
                });

            if (saved) {

                toast.success(
                    "Frågetyp ändrad"
                );

            }

        };

    useEffect(() => {

        const loadLevels =
            async () => {

                const response =
                    await fetch(
                        `${API_URL}/api/question-levels`,
                        {
                            headers:
                                authHeaders()
                        }
                    );

                setLevels(
                    await response.json()
                );

            };

        loadLevels();

    }, []);

    useEffect(() => {

        setQuestionText(
            question.question
        );

    }, [question.question]);

    useEffect(() => {

        setPreviewAnswer(
            question.question_type === "multiple_choice"
                ? []
                : ""
        );

    }, [question.id, question.question_type]);

    return (

        <>

            <DetailLayout

                sidebar={

                    <div className="space-y-4">

                        <Card>

                            <CardHeader>

                                <CardTitle>
                                    Information
                                </CardTitle>

                            </CardHeader>

                            <CardContent
                                className="
                                    space-y-3
                                "
                            >

                                <div>

                                    <Badge>
                                        ID #{question.id}
                                    </Badge>

                                </div>

                                <div>

                                    <select
                                        className="
                                            border
                                            rounded
                                            px-2
                                            py-1
                                            text-sm
                                        "
                                        value={
                                            question.question_type
                                        }
                                        disabled={savingQuestion}
                                        onChange={(e) =>
                                            changeQuestionType(
                                                e.target.value
                                            )
                                        }
                                    >

                                        {Object.values(QUESTION_TYPES).map(
                                            type => (
                                                <option
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                <div>

                                    <Badge
                                        variant="outline"
                                    >
                                        {
                                            question.level_name
                                            ?? "Saknas"
                                        }
                                    </Badge>

                                </div>

                            </CardContent>

                        </Card>

                        <Card>

                            <CardHeader>

                                <CardTitle>
                                    Bedömning
                                </CardTitle>

                            </CardHeader>

                            <CardContent>

                                <AnswerConfigEditor
                                    question={question}
                                    onChanged={onChanged}
                                />

                            </CardContent>

                        </Card>

                    </div>

                }

            >

                <div className="space-y-6">

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Uppgift
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            {!editingQuestion ? (

                                <div
                                    className="
                                        flex
                                        justify-between
                                        gap-4
                                    "
                                >

                                    <MathContent
                                        value={
                                            question.question
                                        }
                                    />

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setEditingQuestion(
                                                true
                                            )
                                        }
                                    >
                                        Redigera
                                    </Button>

                                </div>

                            ) : (

                                <div
                                    className="
                                        space-y-4
                                    "
                                >

                                    <textarea
                                        rows={5}
                                        className="
                                            input-standard
                                            w-full
                                        "
                                        value={
                                            questionText
                                        }
                                        onChange={(e) =>
                                            setQuestionText(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <div
                                        className="
                                            flex
                                            justify-end
                                            gap-2
                                        "
                                    >

                                        <Button
                                            disabled={savingQuestion}
                                            onClick={saveQuestionText}
                                        >
                                            Spara
                                        </Button>

                                        <Button
                                            variant="outline"
                                            disabled={savingQuestion}
                                            onClick={() => {
                                                setQuestionText(
                                                    question.question
                                                );
                                                setEditingQuestion(
                                                    false
                                                );
                                            }}
                                        >
                                            Avbryt
                                        </Button>

                                    </div>

                                </div>

                            )}

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Media
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    gap-4
                                "
                            >

                                {question.media?.map(
                                    media => (

                                        <div
                                            key={media.id}
                                        >

                                            <img
                                                src={`${API_URL}${media.media_url}`}
                                                alt=""
                                                className="
                                                    rounded-xl
                                                    border
                                                    w-48
                                                "
                                            />

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() =>
                                                    setMediaToDelete(
                                                        media.id
                                                    )
                                                }
                                            >
                                                Ta bort
                                            </Button>

                                        </div>

                                    )
                                )}

                            </div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Svarsalternativ
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            {question.question_type ===
                                "numeric_input" && (

                                <p
                                    className="
                                        text-sm
                                        text-muted-foreground
                                        mb-3
                                    "
                                >
                                    Lägg till ett alternativ per svarsruta
                                    (markerat som korrekt), i samma ordning
                                    som {"{{input}}"}-markeringarna i
                                    frågetexten.
                                </p>

                            )}

                            {getNumericDefaultAnswer(question) !== null && (
                                <div className="flex items-center gap-2 text-sm mb-3">
                                    <MathContent
                                        value={getNumericDefaultAnswer(question)}
                                    />
                                    <span className="text-green-600">
                                        Rätt svar
                                    </span>
                                </div>
                            )}

                            <OptionList
                                questionId={
                                    question.id
                                }
                                options={
                                    question.options
                                }
                                onChanged={
                                    onChanged
                                }
                            />

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Förhandsgranska som elev
                            </CardTitle>

                        </CardHeader>

                        <CardContent
                            className="space-y-3"
                        >

                            <div
                                className="
                                    rounded-lg
                                    border
                                    bg-background
                                    p-6
                                    space-y-4
                                "
                            >

                                <QuestionView
                                    question={question}
                                    answer={previewAnswer}
                                    onTextAnswer={handlePreviewTextAnswer}
                                    onSingleChoice={handlePreviewSingleChoice}
                                    onMultiChoice={handlePreviewMultiChoice}
                                />

                            </div>

                            {previewResult && (

                                <div
                                    className={`
                                        font-medium
                                        ${
                                            previewResult.correct
                                                ? "text-green-600"
                                                : previewResult.pointsFraction > 0
                                                    ? "text-amber-600"
                                                    : "text-red-600"
                                        }
                                    `}
                                >

                                    {
                                        previewResult.correct
                                            ? "✓ Rätt"
                                            : previewResult.pointsFraction > 0
                                                ? `◐ Delvis rätt (${Math.round(previewResult.pointsFraction * 100) / 100} p)`
                                                : "✗ Fel"
                                    }

                                </div>

                            )}

                        </CardContent>

                    </Card>

                </div>

            </DetailLayout>

            <DeleteMediaDialog
                open={
                    mediaToDelete !== null
                }
                onOpenChange={() =>
                    setMediaToDelete(null)
                }
            />

        </>

    );

}