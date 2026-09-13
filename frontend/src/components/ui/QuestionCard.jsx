import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

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

function parseAnswerConfig(answerConfig) {
    if (!answerConfig) return {};
    if (typeof answerConfig === "string") {
        try {
            const parsed = JSON.parse(answerConfig);
            return typeof parsed === "string" ? JSON.parse(parsed) : (parsed || {});
        } catch {
            return {};
        }
    }
    return answerConfig;
}

function getNumericDefaultAnswer(question) {

    const answerConfig = parseAnswerConfig(question.answer_config);

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

export function syncNumericInputs(text, correctCount) {
    if (correctCount <= 0) return text || "";

    const cleanText = (text || "").trim();

    // Strip trailing input lines: e.g. "x = {{input}}", "x_1 = {{input}}", "x_2 = {{input}}", "{{input}}", "Svar: {{input}}"
    const lines = cleanText.split("\n");
    while (lines.length > 0) {
        const lastLine = lines[lines.length - 1].trim();
        if (
            lastLine === "{{input}}" ||
            /^(?:svar:\s*)?(?:[a-zA-Z](?:_\d+)?\s*=\s*)?\{\{input\}\}\s*$/i.test(lastLine)
        ) {
            lines.pop();
        } else {
            break;
        }
    }

    const basePrompt = lines.join("\n").trim();

    const inputLines = [];
    if (correctCount === 1) {
        inputLines.push("x = {{input}}");
    } else {
        for (let i = 1; i <= correctCount; i++) {
            inputLines.push(`x_${i} = {{input}}`);
        }
    }

    if (!basePrompt) {
        return inputLines.join("\n");
    }

    return `${basePrompt}\n${inputLines.join("\n")}`;
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
            question.level_id ?? null
        );

    const [calculatorAllowed,
        setCalculatorAllowed] =
        useState(
            Boolean(question.calculator_allowed)
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

        const config = parseAnswerConfig(question.answer_config);

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

                const currentConfig = parseAnswerConfig(question.answer_config);

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
                            answer_config: currentConfig,
                            level_id: levelId ?? question.level_id,
                            calculator_allowed: calculatorAllowed,
                            ...overrides
                        })
                    }
                );

                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    throw new Error(
                        data?.error || "Kunde inte spara frågan."
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
                await saveQuestion({
                    question: questionText
                });

            if (saved) {

                setEditingQuestion(false);

                toast.success(
                    "Frågetext sparad"
                );

            }

        };

    const changeQuestionType =
        async (newType) => {

            let updatedQuestion = question.question;
            if (newType === "numeric_input" && !question.question?.includes("{{input}}")) {
                const targetCount = correctOptions.length || 1;
                updatedQuestion = syncNumericInputs(question.question, targetCount);
                setQuestionText(updatedQuestion);
            }

            const saved =
                await saveQuestion({
                    question: updatedQuestion,
                    question_type: newType
                });

            if (saved) {

                toast.success(
                    "Frågetyp ändrad"
                );

            }

        };

    const changeCalculatorPermission =
        async (allowed) => {
            setCalculatorAllowed(allowed);

            const saved = await saveQuestion({
                calculator_allowed: allowed
            });

            if (saved) {
                toast.success("Miniräknarinställning sparad");
            }
        };

    const deleteMedia =
        async () => {
            if (!mediaToDelete) return;

            try {
                const response = await fetch(
                    `${API_URL}/api/questions/media/${mediaToDelete}`,
                    {
                        method: "DELETE",
                        headers: authHeaders()
                    }
                );

                if (!response.ok) {
                    throw new Error("Kunde inte ta bort mediefilen.");
                }

                toast.success("Media borttagen");
                await onChanged?.();
            } catch (error) {
                toast.error(error.message);
            } finally {
                setMediaToDelete(null);
            }
        };

    const handleUploadMedia =
        async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch(
                    `${API_URL}/api/questions/${question.id}/media`,
                    {
                        method: "POST",
                        headers: authHeaders(),
                        body: formData
                    }
                );

                if (!response.ok) {
                    throw new Error("Kunde inte ladda upp media.");
                }

                toast.success("Media uppladdad");
                await onChanged?.();
            } catch (error) {
                toast.error(error.message);
            } finally {
                e.target.value = "";
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
            question.question || ""
        );
        setEditingQuestion(false);

    }, [question.id]);

    useEffect(() => {
        if (!editingQuestion) {
            setQuestionText(question.question || "");
        }
    }, [question.question]);

    useEffect(() => {

        setCalculatorAllowed(
            Boolean(question.calculator_allowed)
        );

    }, [question.id, question.calculator_allowed]);

    useEffect(() => {

        setLevelId(
            question.level_id ?? null
        );

    }, [question.id, question.level_id]);

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
                                            w-full
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

                                    {levels.length > 0 ? (
                                        <select
                                            className="
                                                border
                                                rounded
                                                px-2
                                                py-1
                                                text-sm
                                                w-full
                                            "
                                            value={levelId ?? ""}
                                            disabled={savingQuestion}
                                            onChange={async (e) => {
                                                const newLevel = e.target.value ? Number(e.target.value) : null;
                                                setLevelId(newLevel);
                                                const saved = await saveQuestion({
                                                    level_id: newLevel
                                                });
                                                if (saved) {
                                                    toast.success("Nivå sparad");
                                                }
                                            }}
                                        >
                                            <option value="">Välj nivå...</option>
                                            {levels.map(lvl => (
                                                <option
                                                    key={lvl.id}
                                                    value={lvl.id}
                                                >
                                                    {lvl.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                        >
                                            {
                                                question.level_name
                                                ?? "Saknas"
                                            }
                                        </Badge>
                                    )}

                                </div>

                                <label
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={calculatorAllowed}
                                        disabled={savingQuestion}
                                        onChange={(e) =>
                                            changeCalculatorPermission(
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Miniräknare tillåten
                                </label>

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

                            {!editingQuestion && (
                                <CardAction>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setEditingQuestion(
                                                true
                                            )
                                        }
                                    >
                                        Redigera
                                    </Button>
                                </CardAction>
                            )}

                        </CardHeader>

                        <CardContent className="space-y-4">

                            {question.question_type === "numeric_input" &&
                                correctOptions.length > 0 &&
                                (question.question?.match(/\{\{input\}\}/g) || []).length !== correctOptions.length && (
                                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-xl p-3 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div>
                                        <strong>Antal svarsrutor stämmer inte:</strong> Frågan har{" "}
                                        {(question.question?.match(/\{\{input\}\}/g) || []).length} ruta/rutor (<code>{'{{input}}'}</code>)
                                        men {correctOptions.length} rätta svar i facit.
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        type="button"
                                        disabled={savingQuestion}
                                        onClick={async () => {
                                            const synced = syncNumericInputs(
                                                question.question,
                                                correctOptions.length
                                            );
                                            setQuestionText(synced);
                                            const saved = await saveQuestion({ question: synced });
                                            if (saved) {
                                                toast.success("Svarsrutor synkroniserade");
                                            }
                                        }}
                                    >
                                        Synkronisera ({correctOptions.length === 1 ? "x = {{input}}" : `x_1..x_${correctOptions.length} = {{input}}`})
                                    </Button>
                                </div>
                            )}

                            {!editingQuestion ? (

                                <div className="space-y-2">
                                    <MathContent
                                        className="text-base"
                                        value={
                                            question.question
                                        }
                                    />
                                </div>

                            ) : (

                                <div
                                    className="
                                        space-y-4
                                    "
                                >

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">Snabbval:</span>
                                        {correctOptions.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="xs"
                                                onClick={() =>
                                                    setQuestionText(prev =>
                                                        syncNumericInputs(prev, correctOptions.length)
                                                    )
                                                }
                                            >
                                                Anpassa efter facit ({correctOptions.length} st: {correctOptions.length === 1 ? "x" : `x_1..x_${correctOptions.length}`})
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={() =>
                                                setQuestionText(prev =>
                                                    prev ? `${prev}\nx = {{input}}` : "x = {{input}}"
                                                )
                                            }
                                        >
                                            + x = {"{{input}}"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={() =>
                                                setQuestionText(prev =>
                                                    prev
                                                        ? `${prev}\nx_1 = {{input}}\nx_2 = {{input}}`
                                                        : "x_1 = {{input}}\nx_2 = {{input}}"
                                                )
                                            }
                                        >
                                            + x_1, x_2 = {"{{input}}"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={() =>
                                                setQuestionText(prev =>
                                                    prev ? `${prev} {{input}}` : "{{input}}"
                                                )
                                            }
                                        >
                                            + {"{{input}}"}
                                        </Button>
                                    </div>

                                    <Textarea
                                        rows={5}
                                        className="font-mono text-sm w-full"
                                        value={
                                            questionText
                                        }
                                        placeholder="Skriv frågetext här..."
                                        onChange={(e) =>
                                            setQuestionText(
                                                e.target.value
                                            )
                                        }
                                    />

                                    {questionText && (
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Förhandsgranskning
                                            </div>
                                            <div className="math-preview">
                                                <MathContent
                                                    value={questionText}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className="
                                            flex
                                            justify-end
                                            gap-2
                                        "
                                    >

                                        <Button
                                            type="button"
                                            disabled={savingQuestion}
                                            onClick={saveQuestionText}
                                        >
                                            Spara
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={savingQuestion}
                                            onClick={() => {
                                                setQuestionText(
                                                    question.question || ""
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