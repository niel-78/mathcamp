import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { toast } from "sonner";
import ArchiveQuestionDialog from "@/components/ui/ArchiveQuestionDialog";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";    
import MathContent from "@/components/ui/MathContent";
import { checkOptionValues } from "@/utils/checkOptionValues";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

function getDisplayedOptions(question) {

    if (question.options?.length > 0) {
        return question.options;
    }

    if (
        question.question_type === "numeric_input" &&
        question.answer_config?.default_answer !== undefined &&
        question.answer_config?.default_answer !== ""
    ) {
        return [
            {
                id: `numeric-answer-${question.id}`,
                text: question.answer_config.default_answer,
                is_correct: 1
            }
        ];
    }

    return [];
}

export default function BlockContent({
    block,
    area,
    openTab,
    blockRefreshKey
}) {

    const [currentBlock, setCurrentBlock] = useState(block);    

    const [questionToArchive, setQuestionToArchive] = useState(null);

    const [operationsDialogOpen, setOperationsDialogOpen] = useState(false);

    useEffect(() => {
        setCurrentBlock(block);
    }, [block]);

    useEffect(() => {
        loadBlock();
    }, [block.id, blockRefreshKey]);

    const loadBlock = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/${block.id}/`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();
        setCurrentBlock(data);
    };

    const createQuestion = async () => {

        const lastQuestion =
            currentBlock.questions[
                currentBlock.questions.length - 1
            ];

        const response = await fetch(
            `${API_URL}/api/blocks/${currentBlock.id}/questions`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question_type: lastQuestion?.question_type ?? 1,
                    answer_config:
                        lastQuestion?.answer_config ??
                        {}
                })
            }
        );

        if (!response.ok) {

            const text = await response.text();

            toast.error(text);

            return;
        }

        await loadBlock();

        toast.success(
            "Uppgift skapad"
        );

    };

    const updateQuestionLevel =
        async (
            questionId,
            seriesLevelId
        ) => {

            const response =
                await fetch(
                    `${API_URL}/api/questions/${questionId}/series-level`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            series_level_id: Number(seriesLevelId)
                        })
                    }
                );

            if (!response.ok) {
                toast.error(
                    "Kunde inte ändra nivå"
                );
                return;
            }

            await loadBlock();

            toast.success(
                "Nivå uppdaterad"
            );

        };

    const duplicateQuestion =
        async (questionId) => {

            const response =
                await fetch(
                    `${API_URL}/api/questions/${questionId}/duplicate`,
                    {
                        method: "POST",
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                toast.error(
                    "Kunde inte duplicera uppgiften"
                );
                return;
            }

            await loadBlock();

            toast.success(
                "Uppgift duplicerad"
            );
        };

    const setQuestionAssessmentExclusion =
        async (question, excluded) => {

            const response = await fetch(
                `${API_URL}/api/questions/${question.id}/exclude-from-assessments`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        excluded_from_assessments: excluded
                    })
                }
            );

            if (!response.ok) {
                toast.error("Kunde inte uppdatera uppgiften");
                return;
            }

            await loadBlock();
            toast.success(
                excluded
                    ? "Uppgiften tas inte med i prov eller resultat"
                    : "Uppgiften tas med i framtida prov igen"
            );
        };

    const deleteQuestionReports =
        async (questionId) => {

            const response = await fetch(
                `${API_URL}/api/questions/${questionId}/question-reports`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                toast.error("Kunde inte ta bort felanmälningarna");
                return;
            }

            await loadBlock();
            toast.success("Felanmälningarna togs bort");
        };

    // Bulk-marks every question in the block as an equation: numeric_input question
    // type with one answer box per root (unlabeled "x = " for a single root, subscripted
    // "x_1 = " / "x_2 = " ... for two or more), and order-independent grading (so a
    // double root only needs to be entered once, and root order doesn't matter).
    const applyEquationsPreset = async () => {

        const questions = currentBlock?.questions || [];

        const confirmed = window.confirm(
            `Markera alla ${questions.length} uppgifter i blocket som ekvationer? \n\n` +
            "Detta sätter frågetyp till numeriska svarsrutor och lägger till en svarsruta per rätt " +
            "svarsalternativ som saknas i frågetexten (\"x = {{input}}\" vid en rot, \"x_1 = {{input}}\", " +
            "\"x_2 = {{input}}\" osv vid flera), samt aktiverar \"Svarsordning saknar betydelse\"."
        );

        if (!confirmed) {
            return;
        }

        for (const question of questions) {

            const config =
                typeof question.answer_config === "string"
                    ? JSON.parse(question.answer_config || "{}")
                    : question.answer_config || {};

            const correctAnswerCount =
                (question.options || [])
                    .filter(o => o.is_correct).length;

            const currentInputCount =
                (
                    (question.question || "")
                        .match(/{{input}}/g) || []
                ).length;

            const missingInputCount =
                Math.max(
                    correctAnswerCount - currentInputCount,
                    0
                );

            // If this now needs 2+ roots, relabel a lone unlabeled "x = {{input}}"
            // (from an earlier single-root version of the question) to "x_1 = {{input}}"
            // so it doesn't end up mismatched with the newly appended "x_2 = {{input}}" etc.
            let questionText = question.question || "";

            if (correctAnswerCount >= 2) {
                questionText = questionText.replace(
                    /x\s*=\s*\{\{input\}\}/,
                    "x_1 = {{input}}"
                );
            }

            const additionalLines = [];

            for (let i = 0; i < missingInputCount; i++) {

                const rootNumber = currentInputCount + i + 1;

                const label =
                    correctAnswerCount === 1
                        ? "x"
                        : `x_${rootNumber}`;

                additionalLines.push(
                    `${label} = {{input}}`
                );

            }

            const updatedQuestionText =
                additionalLines.length === 0
                    ? questionText
                    : `${questionText}\n${additionalLines.join("\n")}`.trim();

            const response = await fetch(
                `${API_URL}/api/questions/${question.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question: updatedQuestionText,
                        question_type: "numeric_input",
                        level_id: question.level_id,
                        answer_config: {
                            ...config,
                            order_independent: true
                        }
                    })
                }
            );

            if (!response.ok) {
                toast.error(`Kunde inte uppdatera uppgift #${question.id}`);
            }

        }

        await loadBlock();

        toast.success("Uppgifterna är nu markerade som ekvationer");

        setOperationsDialogOpen(false);

    };

    const sortedQuestions =
        [...(currentBlock?.questions || [])]
            .sort((a, b) => {

                const aLevel =
                    a.series_level_sort_order || 999;

                const bLevel =
                    b.series_level_sort_order || 999;

                if (aLevel !== bLevel) {
                    return aLevel - bLevel;
                }

                return a.id - b.id;
            });

    return (
        <>
            <BaseTabLayout
                title={`Block #${currentBlock.id}`}
                actions={
                    <div className="flex gap-2">

                        <Button
                            variant="outline"
                            onClick={() => setOperationsDialogOpen(true)}
                        >
                            Operationer
                        </Button>

                        <Button
                            onClick={createQuestion}
                        >
                            Ny uppgift
                        </Button>

                    </div>
                }
            >
                <div className="space-y-2">


                    {sortedQuestions.map((question, index) => (

                        <div
                            key={
                                question.id ??
                                `loading-question-${index}`
                            }
                            className="
                                border
                                p-2
                                rounded
                                flex
                                justify-between
                                items-start
                            "
                        >

                            <div className="flex min-w-0 flex-1 flex-col gap-3">

                                <div className="flex items-center gap-2">

                                    <MathContent value={question.question} />

                                    {question.options?.length > 1 && (() => {
                                        const optionCheck = checkOptionValues(
                                            question.options
                                        );

                                        if (optionCheck.valid) {
                                            return null;
                                        }

                                        return (
                                            <span
                                                className="text-sm text-red-600"
                                                title={optionCheck.issues.join("\n")}
                                            >
                                                Fel i svarsalternativ
                                            </span>
                                        );
                                    })()}

                                    {Number(question.report_count) > 0 && (
                                        <span className="text-sm text-amber-700">
                                            {question.report_count} {Number(question.report_count) > 1
                                                ? "felanmälningar"
                                                : "felanmälan"}
                                        </span>
                                    )}

                                    {question.excluded_from_assessments === 1 && (
                                        <span className="text-sm text-red-600">
                                            Exkluderad från prov och resultat
                                        </span>
                                    )}

                                </div>

                                {getDisplayedOptions(question).length > 0 && (
                                    <div className="grid gap-1 pl-2">
                                        {getDisplayedOptions(question).map(option => (
                                            <div
                                                key={option.id}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <MathContent value={option.text} />
                                                <span
                                                    className={
                                                        option.is_correct
                                                            ? "text-green-600"
                                                            : "text-muted-foreground"
                                                    }
                                                >
                                                    {option.is_correct
                                                        ? "Rätt svar"
                                                        : "Felaktigt"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>

                            <div className="flex shrink-0 items-center gap-2">

                                <select
                                    value={question.series_level_id || ""}
                                    onChange={(e) =>
                                        updateQuestionLevel(
                                            question.id,
                                            e.target.value
                                        )
                                    }
                                    className="border rounded px-2 py-1"
                                >
                                    {currentBlock.levels?.map(level => (
                                        <option
                                            key={level.id}
                                            value={level.id}
                                        >
                                            {level.sort_order}
                                            {level.name
                                                ? ` - ${level.name}`
                                                : ""}
                                        </option>
                                    ))}
                                </select>

                                <Button
                                    size="sm"
                                    disabled={!question.id}
                                    onClick={() =>
                                        openTab(
                                            {
                                                id: `question-${question.id}`,
                                                type: "question",
                                                title: `Uppgift #${question.id}`,
                                                questionId: question.id
                                            },
                                            area
                                        )
                                    }
                                >
                                    Öppna
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        duplicateQuestion(
                                            question.id
                                        )
                                    }
                                >
                                    Duplicera
                                </Button>

                                {(Number(question.report_count) > 0 ||
                                    question.excluded_from_assessments === 1) && (
                                    <div
                                        key={`report-actions-${question.id}`}
                                        className="flex items-center gap-2"
                                    >
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                setQuestionAssessmentExclusion(
                                                    question,
                                                    !question.excluded_from_assessments
                                                )
                                            }
                                        >
                                            {question.excluded_from_assessments
                                                ? "Återställ i prov"
                                                : "Ta bort från prov/resultat"}
                                        </Button>

                                        {Number(question.report_count) > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    deleteQuestionReports(question.id)
                                                }
                                            >
                                                Ta bort felanmälan
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {currentBlock.isOwner && (

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setQuestionToArchive(
                                                question
                                            )
                                        }
                                    >
                                        Arkivera
                                    </Button>

                                )}

                            </div>

                        </div>

                    ))}

                </div>
            </BaseTabLayout>

            <ArchiveQuestionDialog
                question={questionToArchive}
                open={!!questionToArchive}
                onOpenChange={(open) => {

                    if (!open) {

                        setQuestionToArchive(null);

                    }

                }}
                onArchived={async () => {

                    await loadBlock();

                }}
            />

            <Dialog
                open={operationsDialogOpen}
                onOpenChange={setOperationsDialogOpen}
            >

                <DialogContent>

                    <DialogHeader>

                        <DialogTitle>
                            Operationer
                        </DialogTitle>

                        <DialogDescription>
                            Massåtgärder som appliceras på alla uppgifter i blocket.
                        </DialogDescription>

                    </DialogHeader>

                    <Button
                        variant="outline"
                        onClick={applyEquationsPreset}
                    >
                        Är ekvationer
                    </Button>

                    <DialogFooter>

                        <Button
                            variant="outline"
                            onClick={() => setOperationsDialogOpen(false)}
                        >
                            Stäng
                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>


        </>    
    );

}


