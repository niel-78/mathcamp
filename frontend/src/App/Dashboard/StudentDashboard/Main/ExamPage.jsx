import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useExamAttempt } from "@/hooks/useExamAttempt";
import { usePreventBackButton } from "@/hooks/usePreventBackButton";
import { useDisableContextMenu } from "@/hooks/useDisableContextMenu";
import useExamActivityLogging from "@/hooks/useExamActivityLogging";
import { logEvent } from "@/utils/logEvent";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import UserProfile from "@/components/ui/UserProfile";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ExamHeader from "./ExamHeader";
import ExamTimer from "./ExamTimer";
import QuestionView from "./QuestionView.jsx";
import ExamNavigation from "./ExamNavigation";
import Calculator from "@/components/ui/Calculator";
import FormulaSheetButton from "@/components/ui/FormulaSheetButton";

import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareWarning, Settings } from "lucide-react";
import { getSavedShowQuestionInfo } from "@/utils/questionSettings";

const questionTextSizeStorageKey = "math-camp-question-text-size";
const showQuestionInfoStorageKey = "math-camp-show-question-info";
const showCountdownStorageKey = "math-camp-show-countdown";

const questionTextSizeOptions = [
    { value: "normal", label: "Normal", className: "text-base" },
    { value: "large", label: "Stor", className: "text-lg" },
    { value: "xlarge", label: "Extra stor", className: "text-xl" },
    { value: "xxlarge", label: "Mycket stor", className: "text-2xl" }
];

function getSavedQuestionTextSize() {
    try {
        const saved = localStorage.getItem(questionTextSizeStorageKey);

        if (questionTextSizeOptions.some(option => option.value === saved)) {
            return saved;
        }
    } catch {
        // Use the default when localStorage is unavailable.
    }

    return "normal";
}

function getSavedShowCountdown() {
    try {
        const saved = localStorage.getItem(showCountdownStorageKey);

        if (saved === "false") {
            return false;
        }
    } catch {
        // Use the default when localStorage is unavailable.
    }

    return true;
}

export default function ExamPage({
    attemptId,
    formulaGroup = {},
    onExit,
    onLocked
}) {

    usePreventBackButton();
    useDisableContextMenu();
    useExamActivityLogging(attemptId);

    const [index, setIndex] = useState(0);
    const [timeExpired, setTimeExpired] =
        useState(false);
    const [reportDialogOpen, setReportDialogOpen] =
        useState(false);
    const [reportComment, setReportComment] =
        useState("");
    const [reportSubmitting, setReportSubmitting] =
        useState(false);
    const [settingsOpen, setSettingsOpen] =
        useState(false);
    const [questionTextSize, setQuestionTextSize] =
        useState(getSavedQuestionTextSize);
    const [showQuestionInfo, setShowQuestionInfo] =
        useState(() => getSavedShowQuestionInfo());
    const [showCountdown, setShowCountdown] =
        useState(getSavedShowCountdown);
    const [reportedQuestionIds, setReportedQuestionIds] =
        useState(new Set());
    const isSubmittingRef = useRef(false);


    const [dynamicQuestions, setDynamicQuestions] =
        useState([]);
    const hasRestoredIndexRef =
        useRef(false);

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

        if (
            hasRestoredIndexRef.current ||
            !attempt ||
            !dynamicQuestions.length
        ) {
            return;
        }

        hasRestoredIndexRef.current = true;

        const restoredIndex =
            Math.min(
                Math.max(
                    0,
                    Number(attempt.current_question_index) || 0
                ),
                dynamicQuestions.length - 1
            );

        setIndex(restoredIndex);

    }, [attempt, dynamicQuestions]);

    useEffect(() => {

        if (
            !attemptId ||
            !hasRestoredIndexRef.current
        ) {
            return;
        }

        fetch(
            `${API_URL}/api/assessment-attempts/${attemptId}/position`,
            {
                method: "PATCH",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    current_question_index: index
                })
            }
        ).catch(() => {});

    }, [attemptId, index]);

    useEffect(() => {

        if (!attemptId || !dynamicQuestions.length) {
            return;
        }

        logEvent(
            attemptId,
            "question_view",
            {
                question_id: dynamicQuestions[index]?.id,
                question_number: index + 1,
                total_questions: dynamicQuestions.length
            }
        );

    }, [attemptId, index, dynamicQuestions]);

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

    const isTeacherTest =
        attempt?.mode === "test";

    const isSoftEnded =
        attempt?.teacher_end_mode === "soft";

    const isAdaptive =
        attempt?.assessment?.config?.mode ===
        "adaptive";

    const countdownMode =
        attemptConfig?.attempt?.countdownMode ||
        "visible_lock";
    const showClock =
        attemptConfig?.attempt?.showClock !== false &&
        showCountdown;

    const initialSeedCount =
        attemptConfig?.attempt?.initialSeedQuestionCount ||
        attemptConfig?.attempt?.seedQuestionCount ||
        dynamicQuestions.length;

    const currentQuestionNumber = index + 1;
    const isSeedPhase = currentQuestionNumber <= initialSeedCount;
    const calculatorOverride =
        attemptConfig?.teacher_overrides?.calculator_allowed;
    const calculatorAllowed =
        calculatorOverride === undefined
            ? current.calculator_allowed === true ||
                Number(current.calculator_allowed) === 1
            : calculatorOverride === true;
    const geogebraAllowed =
        current.geogebra_allowed === true ||
        Number(current.geogebra_allowed) === 1;
    const questionTextSizeClassName =
        questionTextSizeOptions.find(option => option.value === questionTextSize)?.className ||
        "text-base";

    const saveQuestionTextSize = (value) => {
        setQuestionTextSize(value);
        localStorage.setItem(questionTextSizeStorageKey, value);
    };

    const saveShowQuestionInfo = (value) => {
        setShowQuestionInfo(value);
        localStorage.setItem(showQuestionInfoStorageKey, String(value));
    };

    const saveShowCountdown = (value) => {
        setShowCountdown(value);
        localStorage.setItem(showCountdownStorageKey, String(value));
    };


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

    };

    const submitExam =
        async () => {

            if (isSubmittingRef.current) {
                return;
            }

            isSubmittingRef.current = true;

            try {

                await logEvent(
                    attemptId,
                    "attempt_submitted"
                );

                const response =
                    await fetch(
                        `${API_URL}/api/assessment-attempts/${attemptId}/submit`,
                        {
                            method: "POST",
                            headers:
                                authHeaders()
                        }
                    );

                if (!response.ok) {

                    const result =
                        await response.json().catch(
                            () => ({})
                        );

                    toast.error(
                        result.error ||
                        "Kunde inte lämna in provet."
                    );
                    return;

                }

                onExit();

            } catch {

                toast.error(
                    "Kunde inte lämna in provet."
                );

            } finally {

                isSubmittingRef.current = false;

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

            if (timeExpired) {
                await submitExam();
                return;
            }

            if (isSoftEnded) {
                return;
            }

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

            if (timeExpired) {
                await submitExam();
                return;
            }

            if (isSoftEnded) {
                return;
            }

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

            if (timeExpired) {
                await submitExam();
                return;
            }

            if (isSoftEnded) {
                return;
            }

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

    const submitQuestionReport =
        async () => {

            setReportSubmitting(true);

            try {
                const response = await fetch(
                    `${API_URL}/api/assessment-attempts/${attemptId}/question-reports`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...authHeaders()
                        },
                        body: JSON.stringify({
                            question_id: current.id,
                            comment: reportComment
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Kunde inte skicka felanmälan."
                    );
                }

                setReportedQuestionIds(previous =>
                    new Set([
                        ...previous,
                        current.id
                    ])
                );
                setReportComment("");
                setReportDialogOpen(false);
                toast.success("Felanmälan skickad.");

            } catch (error) {
                toast.error(error.message);
            } finally {
                setReportSubmitting(false);
            }

        };

    return (
        <div className="min-h-screen min-w-0 overflow-x-hidden">

            <div className="flex min-w-0 justify-center px-2 py-3 sm:px-6 sm:py-8">

                <Card className="w-full min-w-0 max-w-4xl">

                    <CardContent className="min-w-0 space-y-6 p-3 sm:p-8">

                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <UserProfile />

                            <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
                                <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                                    <FormulaSheetButton group={formulaGroup} />
                                    <Calculator
                                        key={current.id}
                                        attemptId={attemptId}
                                        questionId={current.id}
                                        showCalculator={calculatorAllowed}
                                        showGeoGebra={geogebraAllowed}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={settingsOpen
                                            ? "border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                                            : "bg-white"}
                                        onClick={() => setSettingsOpen(true)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Inställningar
                                    </Button>
                                </div>

                                {showClock && countdownMode !== "none" && (
                                    <ExamTimer
                                        attempt={attempt}
                                        onExpire={() => {
                                            if (countdownMode === "visible_lock") {
                                                setTimeExpired(true);
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <ExamHeader
                        />

                        {isDiagnostic && (
                            <div className="flex items-center justify-between rounded-md border bg-muted/20 px-4 py-2.5 text-sm">
                                <span className="font-medium text-foreground">
                                    Uppgift {currentQuestionNumber}
                                    {isSeedPhase ? ` / ${initialSeedCount}` : ""}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {isSeedPhase
                                        ? "Basdel (före adaptiv del)"
                                        : current.selection_reason?.startsWith("Komplettering")
                                            ? "Adaptiv del – Komplettering"
                                            : current.selection_reason?.startsWith("Träning")
                                                ? "Adaptiv del – Träning"
                                                : "Adaptiv del"}
                                </span>
                            </div>
                        )}

                        {showQuestionInfo &&
                            isDiagnostic &&
                            current.selection_reason && (

                            <div
                                className="
                                    rounded-md
                                    border
                                    border-dashed
                                    bg-muted/30
                                    p-3
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                {current.selection_reason}
                            </div>

                        )}

                        <div className="min-w-0 break-words">
                            <QuestionView
                                question={current}
                                attemptId={attemptId}
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
                                questionTextClassName={
                                    questionTextSizeClassName
                                }
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={
                                    reportedQuestionIds.has(
                                        current.id
                                    )
                                }
                                onClick={() => {
                                    setReportComment("");
                                    setReportDialogOpen(true);
                                }}
                            >
                                <MessageSquareWarning />
                                {reportedQuestionIds.has(current.id)
                                    ? "Fel anmält"
                                    : "Anmäl fel"}
                            </Button>
                        </div>

                        <ExamNavigation
                            index={index}
                            total={
                                dynamicQuestions.length
                            }
                            allowPrevious={
                                !!attempt?.allow_go_to_previous_question &&
                                (!isDiagnostic || isSeedPhase)
                            }
                            showReset={
                                answerConfig?.default_answer !==
                                    undefined &&
                                answerConfig.default_answer !==
                                    null &&
                                answerConfig.default_answer !==
                                    ""
                            }
                            timeExpired={timeExpired}
                            onPrev={prev}
                            onNext={next}
                            onReset={
                                resetToDefault
                            }
                            onSubmit={
                                submitExam
                            }
                            canSubmitAnytime={
                                isSoftEnded ||
                                isTeacherTest ||
                                (isDiagnostic &&
                                    currentQuestionNumber >=
                                    initialSeedCount)
                            }
                            submitLabel={
                                isTeacherTest
                                    ? "Avsluta test"
                                    : "Lämna in prov"
                            }
                        />

                    </CardContent>

                </Card>

            </div>

            <Dialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Anmäl fel i fråga</DialogTitle>
                        <DialogDescription>
                            Anmäl om det rätta svaret saknas bland alternativen.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        value={reportComment}
                        onChange={event =>
                            setReportComment(event.target.value)
                        }
                        placeholder="Beskriv gärna felet"
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setReportDialogOpen(false)
                            }
                        >
                            Avbryt
                        </Button>
                        <Button
                            type="button"
                            disabled={reportSubmitting}
                            onClick={submitQuestionReport}
                        >
                            Skicka anmälan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Inställningar</DialogTitle>
                        <DialogDescription>
                            Försök: {attemptId}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Textstorlek för uppgiften
                            </div>
                            <div className="grid gap-2">
                                {questionTextSizeOptions.map(option => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant="outline"
                                        className={questionTextSize === option.value
                                            ? "justify-start border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                                            : "justify-start bg-white"}
                                        onClick={() => saveQuestionTextSize(option.value)}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Nedräkning
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className={showCountdown
                                    ? "w-full justify-start border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                                    : "w-full justify-start bg-white"}
                                disabled={attemptConfig?.attempt?.showClock === false}
                                onClick={() => saveShowCountdown(!showCountdown)}
                            >
                                Visa nedräkning
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Uppgiftsinfo
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className={showQuestionInfo
                                    ? "w-full justify-start border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                                    : "w-full justify-start bg-white"}
                                onClick={() => saveShowQuestionInfo(!showQuestionInfo)}
                            >
                                Visa uppgiftsinfo
                            </Button>
                            {current.selection_reason && (
                                <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                                    {current.selection_reason}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );

}