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
import { Check, Circle, X } from "lucide-react";

import DetailLayout
    from "@/components/layouts/DetailLayout";

import MathContent
    from "@/components/ui/MathContent";

import OptionList
    from "@/components/ui/OptionList";

import { gradeAnswer } from "@/utils/grading/gradeAnswer";
import { scoreNumericInput } from "@/utils/grading/gradeNumericInput";
import { scoreLinearSystem } from "@/utils/grading/gradeLinearSystem";

import AnswerConfigEditor
    from "@/components/ui/AnswerConfigEditor";

import DeleteMediaDialog
    from "@/components/ui/DeleteMediaDialog";

import QuestionView
    from "@/App/Dashboard/StudentDashboard/Main/QuestionView";

import { syncNumericInputs } from "@/utils/syncNumericInputs";

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
        !["numeric_input", "equation", "linear_system"].includes(question.question_type) ||
        question.options?.length > 0 ||
        answerConfig?.default_answer === undefined ||
        answerConfig.default_answer === ""
    ) {
        return null;
    }

    return answerConfig.default_answer;
}

function isCorrectOption(option) {
    return (
        option?.is_correct === true ||
        Number(option?.is_correct) === 1 ||
        option?.isCorrect === true ||
        Number(option?.isCorrect) === 1
    );
}

export default function QuestionCard({
    question,
    onChanged,
    groupId
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

    const [geogebraAllowed,
        setGeogebraAllowed] =
        useState(
            Boolean(question.geogebra_allowed)
        );

    const [priority,
        setPriority] =
        useState(
            Boolean(question.is_priority)
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
        question.options?.filter(isCorrectOption) || [];
    const numericInputMarkerCount =
        (questionText.match(/\{\{input\}\}/g) || []).length;
    const needsNumericInputSync =
        question.question_type === "numeric_input" &&
        numericInputMarkerCount !== correctOptions.length;

    const hasPreviewAnswer =
        question.question_type === "multiple_choice"
            ? Array.isArray(previewAnswer) && previewAnswer.length > 0
            : ["numeric_input", "equation", "linear_system"].includes(question.question_type)
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

        if (question.question_type === "linear_system") {
            const score = scoreLinearSystem(previewAnswer, config);
            return {
                correct: score.correct,
                pointsFraction: score.pointsFraction
            };
        }

        if (["numeric_input", "equation"].includes(question.question_type)) {

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

        if (
            question.question_type === "expression" ||
            question.question_type === "text"
        ) {

            const correct = gradeAnswer({
                studentAnswer: previewAnswer,
                correctAnswer: correctOptions[0]?.text,
                questionType: question.question_type,
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
                            geogebra_allowed: geogebraAllowed,
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

    const synchronizeQuestionInputs =
        async () => {

            const updatedQuestion = syncNumericInputs(
                questionText,
                correctOptions.length
            );

            setQuestionText(updatedQuestion);

            if (await saveQuestion({ question: updatedQuestion })) {
                toast.success("Svarsrutor synkroniserade");
            }

        };

    const changeQuestionType =
        async (newType) => {

            const updatedQuestion =
                newType === "numeric_input"
                    ? syncNumericInputs(question.question, correctOptions.length || 1)
                    : question.question;

            setQuestionText(updatedQuestion);

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

    const changeGeoGebraPermission =
        async (allowed) => {
            setGeogebraAllowed(allowed);

            const saved = await saveQuestion({
                geogebra_allowed: allowed
            });

            if (saved) {
                toast.success("GeoGebra-inställning sparad");
            }
        };

    const changePriority =
        async (enabled) => {
            setPriority(enabled);

            try {
                const response = await fetch(
                    `${API_URL}/api/questions/${question.id}/priority`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            block_id: question.block_id,
                            ...(groupId ? { group_id: groupId } : {}),
                            priority: enabled
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error("Kunde inte spara prioriteringen");
                }

                await onChanged?.();
                toast.success("Prioriteringsinställning sparad");
            } catch (error) {
                setPriority(!enabled);
                toast.error(error.message);
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

        setGeogebraAllowed(
            Boolean(question.geogebra_allowed)
        );

    }, [question.id, question.geogebra_allowed]);

    useEffect(() => {
        setPriority(Boolean(question.is_priority));
    }, [question.id, question.is_priority]);

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

                                <label
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={geogebraAllowed}
                                        disabled={savingQuestion}
                                        onChange={(e) =>
                                            changeGeoGebraPermission(
                                                e.target.checked
                                            )
                                        }
                                    />
                                    GeoGebra CAS tillåten
                                </label>

                                <label
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={priority}
                                        disabled={savingQuestion}
                                        onChange={(e) =>
                                            changePriority(
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Prioriterad
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

                                    {question.question_type === "numeric_input" && correctOptions.length > 0 && (

                                    <div className="flex flex-wrap items-center gap-2">
                                        {needsNumericInputSync && (
                                            <button
                                                type="button"
                                                className="text-sm text-amber-700 underline underline-offset-2"
                                                onClick={synchronizeQuestionInputs}
                                            >
                                                Antalet svarsrutor matchar inte antalet korrekta svar.
                                            </button>
                                        )}
                                    </div>

                                    )}

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
                                                src={media.media_url?.startsWith("http")
                                                    ? media.media_url
                                                    : `${API_URL}${media.media_url}`}
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

                            {["numeric_input", "equation", "linear_system"].includes(question.question_type) && (

                                <p
                                    className="
                                        text-sm
                                        text-muted-foreground
                                        mb-3
                                    "
                                >
                                    {question.question_type === "equation"
                                        ? "Lägg till korrekta svar. Eleven väljer själv antal svarsrutor."
                                        : "Lägg till ett korrekt alternativ per {{input}}-markör i frågan."}
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
                                    question={{
                                        ...question,
                                        question: questionText
                                    }}
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

                                    <span className="inline-flex items-center gap-1">
                                        {previewResult.correct ? (
                                            <Check className="h-4 w-4" aria-hidden="true" />
                                        ) : previewResult.pointsFraction > 0 ? (
                                            <Circle className="h-3 w-3" aria-hidden="true" />
                                        ) : (
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {previewResult.correct
                                            ? "Rätt"
                                            : previewResult.pointsFraction > 0
                                                ? `Delvis rätt (${Math.round(previewResult.pointsFraction * 100) / 100} p)`
                                                : "Fel"}
                                    </span>

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