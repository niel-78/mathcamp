import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { toast } from "sonner";
import { QUESTION_TYPES } from "@/constants/assessmentConstants";
import ArchiveQuestionDialog from "@/components/ui/ArchiveQuestionDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";    
import MathContent from "@/components/ui/MathContent";
import QuestionImagePreview from "@/components/ui/QuestionImagePreview";
import { checkOptionValues } from "@/utils/checkOptionValues";
import { checkBlockAnswerKeys } from "@/utils/checkAnswerKey";
import { syncNumericInputs } from "@/utils/syncNumericInputs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

function getDisplayedOptions(question) {

    const answerConfig =
        typeof question.answer_config === "string"
            ? JSON.parse(question.answer_config || "{}")
            : question.answer_config || {};

    if (question.options?.length > 0) {
        return question.options;
    }

    if (
        question.question_type === "numeric_input" &&
        answerConfig?.default_answer !== undefined &&
        answerConfig?.default_answer !== null &&
        String(answerConfig.default_answer).trim() !== ""
    ) {
        return [
            {
                id: `numeric-answer-${question.id}`,
                text: answerConfig.default_answer,
                is_correct: 1
            }
        ];
    }

    return [];
}

function isCorrectOption(option) {
    return (
        option?.is_correct === true ||
        Number(option?.is_correct) === 1 ||
        option?.isCorrect === true ||
        Number(option?.isCorrect) === 1
    );
}

export default function BlockContent({
    block,
    area,
    openTab,
    blockRefreshKey,
    groupId,
    groupName
}) {

    const [currentBlock, setCurrentBlock] = useState(block);    

    const [questionToArchive, setQuestionToArchive] = useState(null);

    const [operationsDialogOpen, setOperationsDialogOpen] = useState(false);

    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

    const [bulkQuestionType, setBulkQuestionType] = useState("");

    const [bulkLevelId, setBulkLevelId] = useState("");

    const [bulkCalculatorAllowed, setBulkCalculatorAllowed] = useState(false);

    const [bulkGeogebraAllowed, setBulkGeogebraAllowed] = useState(false);

    const [bulkPriority, setBulkPriority] = useState(false);

    const [bulkSaving, setBulkSaving] = useState(false);

    const [questionLevels, setQuestionLevels] = useState([]);

    const [syncAnswerOptionsConfirmOpen, setSyncAnswerOptionsConfirmOpen] = useState(false);

    const [answerCheckResult, setAnswerCheckResult] = useState(null);

    const [reviewedAnswerQuestions, setReviewedAnswerQuestions] = useState({});

    const answerReviewStorageKey = `answer-review:block-${block.id}`;

    const selectedQuestions = (currentBlock?.questions || []).filter(question =>
        selectedQuestionIds.includes(question.id)
    );

    const toggleQuestionSelection = (questionId) => {
        setSelectedQuestionIds(previous =>
            previous.includes(questionId)
                ? previous.filter(id => id !== questionId)
                : [...previous, questionId]
        );
    };

    const selectAllQuestions = () => {
        setSelectedQuestionIds((currentBlock?.questions || []).map(question => question.id));
    };

    const clearQuestionSelection = () => {
        setSelectedQuestionIds([]);
    };

    const syncBulkEditorFromSelection = (questions) => {
        const firstQuestion = questions[0];

        if (!firstQuestion) {
            return;
        }

        setBulkQuestionType(firstQuestion.question_type || "");
        setBulkLevelId(firstQuestion.level_id || firstQuestion.series_level_id || "");
        setBulkCalculatorAllowed(Boolean(firstQuestion.calculator_allowed));
        setBulkGeogebraAllowed(Boolean(firstQuestion.geogebra_allowed));
        setBulkPriority(Boolean(firstQuestion.is_priority));
    };

    const openOperations = () => {
        syncBulkEditorFromSelection(selectedQuestions.length > 0
            ? selectedQuestions
            : currentBlock?.questions || []);
        setOperationsDialogOpen(true);
    };

    const loadBlock = async () => {
        const response = await fetch(
            `${API_URL}/api/blocks/${block.id}/${groupId ? `?groupId=${groupId}` : ""}`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();
        setCurrentBlock(data);
        return data;
    };

    useEffect(() => {
        setCurrentBlock(block);
    }, [block]);

    useEffect(() => {
        loadBlock();
    }, [block.id, blockRefreshKey, groupId]);

    useEffect(() => {
        const loadQuestionLevels = async () => {
            const response = await fetch(`${API_URL}/api/question-levels`, {
                headers: authHeaders()
            });

            if (response.ok) {
                setQuestionLevels(await response.json());
            }
        };

        loadQuestionLevels();
    }, []);

    const createQuestion = async () => {
        const lastQuestion = currentBlock.questions[currentBlock.questions.length - 1];
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
                    answer_config: lastQuestion?.answer_config ?? {}
                })
            }
        );

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        await loadBlock();
        toast.success("Uppgift skapad");
    };

    const updateQuestionLevel = async (questionId, seriesLevelId) => {
        const response = await fetch(
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
            toast.error("Kunde inte ändra nivå");
            return;
        }

        await loadBlock();
        toast.success("Nivå uppdaterad");
    };

    const setQuestionCalculatorPermission =
        async (question, allowed) => {
            const answerConfig =
                typeof question.answer_config === "string"
                    ? JSON.parse(question.answer_config || "{}")
                    : question.answer_config || {};

            const response = await fetch(
                `${API_URL}/api/questions/${question.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question: question.question,
                        question_type: question.question_type,
                        answer_config: answerConfig,
                        level_id: question.level_id,
                        calculator_allowed: allowed
                    })
                }
            );

            if (!response.ok) {
                toast.error("Kunde inte uppdatera miniräknarinställningen");
                return;
            }

            await loadBlock();
            toast.success(
                allowed
                    ? "Miniräknare tillåten för uppgiften"
                    : "Miniräknare inte tillåten för uppgiften"
            );
        };

    const setQuestionGeoGebraPermission =
        async (question, allowed) => {
            const answerConfig =
                typeof question.answer_config === "string"
                    ? JSON.parse(question.answer_config || "{}")
                    : question.answer_config || {};

            const response = await fetch(
                `${API_URL}/api/questions/${question.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question: question.question,
                        question_type: question.question_type,
                        answer_config: answerConfig,
                        level_id: question.level_id,
                        geogebra_allowed: allowed
                    })
                }
            );

            if (!response.ok) {
                toast.error("Kunde inte uppdatera GeoGebra-inställningen");
                return;
            }

            await loadBlock();
            toast.success(
                allowed
                    ? "GeoGebra tillåten för uppgiften"
                    : "GeoGebra inte tillåten för uppgiften"
            );
        };

    const setQuestionPriority =
        async (question, priority) => {

            const response = await fetch(
                `${API_URL}/api/questions/${question.id}/priority`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        block_id: currentBlock.id,
                        ...(groupId ? { group_id: groupId } : {}),
                        priority
                    })
                }
            );

            if (!response.ok) {
                toast.error("Kunde inte uppdatera prioriteringen");
                return;
            }

            await loadBlock();
            toast.success(
                priority
                    ? `Uppgiften prioriteras${groupName ? ` för ${groupName}` : ""}`
                    : `Uppgiften prioriteras inte längre${groupName ? ` för ${groupName}` : ""}`
            );
        };

    const saveBulkQuestionChanges = async () => {
        if (selectedQuestions.length === 0) {
            toast.info("Välj minst en uppgift");
            return;
        }

        setBulkSaving(true);
        let failedCount = 0;

        try {
            for (const question of selectedQuestions) {
                const answerConfig =
                    typeof question.answer_config === "string"
                        ? JSON.parse(question.answer_config || "{}")
                        : question.answer_config || {};

                const response = await fetch(
                    `${API_URL}/api/questions/${question.id}`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            question: question.question,
                            question_type: bulkQuestionType,
                            answer_config: answerConfig,
                            level_id: bulkLevelId || null,
                            calculator_allowed: bulkCalculatorAllowed,
                            geogebra_allowed: bulkGeogebraAllowed
                        })
                    }
                );

                if (!response.ok) {
                    failedCount++;
                    continue;
                }

                const priorityResponse = await fetch(
                    `${API_URL}/api/questions/${question.id}/priority`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            block_id: currentBlock.id,
                            ...(groupId ? { group_id: groupId } : {}),
                            priority: bulkPriority
                        })
                    }
                );

                if (!priorityResponse.ok) {
                    failedCount++;
                }
            }

            await loadBlock();
            setOperationsDialogOpen(false);

            if (failedCount > 0) {
                toast.error(`${failedCount} ändringar kunde inte sparas`);
            } else {
                toast.success(`${selectedQuestions.length} uppgifter uppdaterades`);
            }
        } catch (error) {
            toast.error(error.message || "Kunde inte uppdatera uppgifterna");
        } finally {
            setBulkSaving(false);
        }
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

    const syncSingleQuestionInputs = async (question) => {
        const correctCount = (question.options || []).filter(isCorrectOption).length;
        if (correctCount === 0) return;

        try {
            await synchronizeQuestionAnswerOptions(question);

            await loadBlock();
            toast.success("Felaktiga alternativ borttagna och svarsrutor synkroniserade");
        } catch (error) {
            toast.error(error.message || "Kunde inte synkronisera svarsrutor");
        }
    };

    const synchronizeQuestionAnswerOptions = async (question) => {
        const correctCount = (question.options || []).filter(isCorrectOption).length;
        if (correctCount <= 0) return false;

        const incorrectOptions = (question.options || [])
            .filter(option => !isCorrectOption(option));

        await Promise.all(
            incorrectOptions.map(async option => {
                const response = await fetch(
                    `${API_URL}/api/blocks/options/${option.id}`,
                    {
                        method: "DELETE",
                        headers: authHeaders()
                    }
                );

                if (!response.ok) {
                    throw new Error(`Kunde inte ta bort svarsalternativet #${option.id}`);
                }
            })
        );

        const updatedQuestionText = syncNumericInputs(question.question, correctCount);
        const config =
            typeof question.answer_config === "string"
                ? JSON.parse(question.answer_config || "{}")
                : question.answer_config || {};

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
                        order_independent: correctCount > 1 ? true : (config.order_independent ?? false)
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Kunde inte uppdatera uppgift #${question.id}`);
        }

        return true;
    };

    const synchronizeBlockAnswerOptions = () => {
        setSyncAnswerOptionsConfirmOpen(true);
    };

    const runSynchronizeBlockAnswerOptions = async () => {
        setSyncAnswerOptionsConfirmOpen(false);

        const numericQuestions = (currentBlock?.questions || [])
            .filter(question => question.question_type === "numeric_input");
        let synchronizedCount = 0;

        try {
            for (const question of numericQuestions) {
                if (await synchronizeQuestionAnswerOptions(question)) {
                    synchronizedCount++;
                }
            }

            await loadBlock();
            toast.success(`${synchronizedCount} numeriska uppgifter synkroniserade`);
            setOperationsDialogOpen(false);
        } catch (error) {
            toast.error(error.message || "Kunde inte synkronisera svarsalternativen");
        }
    };

    const checkAnswerKeys = () => {
        const result = checkBlockAnswerKeys(currentBlock?.questions || []);
        const reviews = {};

        [...result.checked, ...result.mismatches, ...result.unsupported].forEach(item => {
            reviews[item.question.id] = item.status;
        });

        setReviewedAnswerQuestions(reviews);
        sessionStorage.setItem(answerReviewStorageKey, JSON.stringify(reviews));
        setAnswerCheckResult(result);
        setOperationsDialogOpen(false);
    };

    const applyAnswerSuggestion = async (item) => {
        if (!item.suggestionValues?.length) {
            return;
        }

        try {
            const options = item.question.options || [];

            if (options.length === 0) {
                const currentConfig = typeof item.question.answer_config === "string"
                    ? JSON.parse(item.question.answer_config || "{}")
                    : item.question.answer_config || {};

                if (item.suggestionValues.length !== 1) {
                    throw new Error("Frågan saknar tillräckligt många svarsfält för förslaget.");
                }

                const response = await fetch(
                    `${API_URL}/api/questions/${item.question.id}`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            answer_config: {
                                ...currentConfig,
                                default_answer: item.suggestionValues[0]
                            }
                        })
                    }
                );

                if (!response.ok) throw new Error("Kunde inte ersätta facit.");
            } else {
                if (options.length < item.suggestionValues.length) {
                    throw new Error("Det finns inte tillräckligt många svarsalternativ för förslaget.");
                }

                const unusedOptions = new Set(options.map(option => option.id));
                const assignments = [];
                const normalize = value => String(value || "").replace(/^\$+|\$+$/g, "").replace(/\s+/g, "");

                for (const suggestion of item.suggestionValues) {
                    const matchingOption = options.find(option =>
                        unusedOptions.has(option.id) && normalize(option.text) === normalize(suggestion)
                    );
                    const replacementOption = matchingOption || options.find(option =>
                        unusedOptions.has(option.id) && isCorrectOption(option)
                    ) || options.find(option => unusedOptions.has(option.id));

                    if (!replacementOption) {
                        throw new Error("Kunde inte välja svarsalternativ för förslaget.");
                    }

                    unusedOptions.delete(replacementOption.id);
                    assignments.push({ option: replacementOption, text: suggestion });
                }

                for (const option of options) {
                    const assignment = assignments.find(item => item.option.id === option.id);
                    const response = await fetch(
                        `${API_URL}/api/blocks/options/${option.id}`,
                        {
                            method: "PUT",
                            headers: {
                                ...authHeaders(),
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                text: assignment?.text || option.text,
                                is_correct: Boolean(assignment)
                            })
                        }
                    );

                    if (!response.ok) throw new Error("Kunde inte ersätta facit.");
                }
            }

            const refreshedBlock = await loadBlock();
            const refreshedResult = checkBlockAnswerKeys(refreshedBlock?.questions || []);
            const reviews = {};

            [...refreshedResult.checked, ...refreshedResult.mismatches, ...refreshedResult.unsupported].forEach(review => {
                reviews[review.question.id] = review.status;
            });

            setReviewedAnswerQuestions(reviews);
            sessionStorage.setItem(answerReviewStorageKey, JSON.stringify(reviews));
            setAnswerCheckResult(refreshedResult);
            toast.success("Facit ersatt enligt förslaget");
        } catch (error) {
            toast.error(error.message);
        }
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
                scrollKey={`block-${currentBlock.id}`}
                actions={
                    <div className="flex gap-2">

                        <Button
                            variant="outline"
                            onClick={openOperations}
                        >
                            Operationer{selectedQuestionIds.length > 0
                                ? ` (${selectedQuestionIds.length} valda)`
                                : ""}
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

                            <input
                                type="checkbox"
                                aria-label={`Välj uppgift #${question.id}`}
                                checked={selectedQuestionIds.includes(question.id)}
                                onChange={() => toggleQuestionSelection(question.id)}
                                className="mt-1 h-4 w-4 shrink-0"
                            />

                            <div className="flex min-w-0 flex-1 flex-col gap-3">

                                <QuestionImagePreview media={question.media} />

                                <div className="flex flex-wrap items-center gap-2">

                                    <MathContent value={question.question} />

                                    {reviewedAnswerQuestions[question.id] === "ok" && (
                                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                            Facit kontrollerat
                                        </span>
                                    )}

                                    {reviewedAnswerQuestions[question.id] === "mismatch" && (
                                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                            Avvikelse hittad
                                        </span>
                                    )}

                                    {reviewedAnswerQuestions[question.id] === "unsupported" && (
                                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                            Ej automatiskt kontrollerad
                                        </span>
                                    )}

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

                                    {question.question_type === "numeric_input" && (() => {
                                        const correctCount = (question.options || [])
                                            .filter(isCorrectOption).length;
                                        const markerCount = (question.question.match(/\{\{input\}\}/g) || []).length;

                                        return correctCount !== markerCount ? (
                                            <button
                                                type="button"
                                                className="text-sm text-amber-700 underline underline-offset-2"
                                                onClick={() => syncSingleQuestionInputs(question)}
                                            >
                                                Antalet svarsrutor matchar inte antalet korrekta svar.
                                            </button>
                                        ) : null;
                                    })()}

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
                                                        isCorrectOption(option)
                                                            ? "text-green-600"
                                                            : "text-muted-foreground"
                                                    }
                                                >
                                                    {isCorrectOption(option)
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

                                <label
                                    className="flex items-center gap-1 text-sm whitespace-nowrap"
                                    title="Tillåt miniräknare för uppgiften"
                                >
                                    <input
                                        type="checkbox"
                                        checked={Boolean(question.calculator_allowed)}
                                        onChange={(e) =>
                                            setQuestionCalculatorPermission(
                                                question,
                                                e.target.checked
                                            )
                                        }
                                    />
                                    Räknare
                                </label>

                                <label
                                    className="flex items-center gap-1 text-sm whitespace-nowrap"
                                    title="Tillåt GeoGebra CAS för uppgiften"
                                >
                                    <input
                                        type="checkbox"
                                        checked={Boolean(question.geogebra_allowed)}
                                        onChange={(e) =>
                                            setQuestionGeoGebraPermission(
                                                question,
                                                e.target.checked
                                            )
                                        }
                                    />
                                    GeoGebra
                                </label>

                                <label
                                        className="flex items-center gap-1 text-sm whitespace-nowrap"
                                        title={
                                            groupId && groupName
                                                ? `Prioritera uppgiften för ${groupName} (används i första hand tills eleven gjort alla prioriterade uppgifter i blocket)`
                                                : groupId
                                                ? "Prioritera uppgiften för gruppen"
                                                : "Prioritera uppgiften som standard i blocket"
                                        }
                                    >
                                        <input
                                            type="checkbox"
                                            checked={Boolean(question.is_priority)}
                                            onChange={(e) =>
                                                setQuestionPriority(
                                                    question,
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        Prioriterad
                                    </label>

                                <Button
                                    size="sm"
                                    disabled={!question.id}
                                    onClick={() =>
                                        openTab(
                                            {
                                                id: `question-${question.id}`,
                                                type: "question",
                                                title: `Uppgift #${question.id}`,
                                                questionId: question.id,
                                                groupId,
                                                groupName
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Ändra valda uppgifter</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span>{selectedQuestions.length} av {currentBlock?.questions?.length || 0} valda</span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={selectAllQuestions}
                                        >
                                            Välj alla
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={clearQuestionSelection}
                                        >
                                            Rensa
                                        </Button>
                                    </div>
                                </div>

                                <select
                                    className="border rounded px-2 py-1 text-sm w-full"
                                    value={bulkQuestionType}
                                    disabled={bulkSaving}
                                    onChange={(e) => setBulkQuestionType(e.target.value)}
                                >
                                    {Object.values(QUESTION_TYPES).map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    className="border rounded px-2 py-1 text-sm w-full"
                                    value={bulkLevelId}
                                    disabled={bulkSaving}
                                    onChange={(e) => setBulkLevelId(e.target.value)}
                                >
                                    <option value="">Välj nivå...</option>
                                    {questionLevels.map(level => (
                                        <option key={level.id} value={level.id}>
                                            {level.name}
                                        </option>
                                    ))}
                                </select>

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={bulkCalculatorAllowed}
                                        disabled={bulkSaving}
                                        onChange={(e) => setBulkCalculatorAllowed(e.target.checked)}
                                    />
                                    Miniräknare tillåten
                                </label>

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={bulkGeogebraAllowed}
                                        disabled={bulkSaving}
                                        onChange={(e) => setBulkGeogebraAllowed(e.target.checked)}
                                    />
                                    GeoGebra CAS tillåten
                                </label>

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={bulkPriority}
                                        disabled={bulkSaving}
                                        onChange={(e) => setBulkPriority(e.target.checked)}
                                    />
                                    Prioriterad
                                </label>

                                <Button
                                    type="button"
                                    className="w-full"
                                    disabled={bulkSaving || selectedQuestions.length === 0}
                                    onClick={saveBulkQuestionChanges}
                                >
                                    {bulkSaving ? "Sparar..." : "Spara på valda uppgifter"}
                                </Button>
                            </CardContent>
                        </Card>

                    <Button
                        variant="outline"
                        onClick={checkAnswerKeys}
                    >
                        Kontrollera facit
                    </Button>

                    <Button
                        variant="outline"
                        onClick={synchronizeBlockAnswerOptions}
                    >
                        Synkronisera svarsalternativ för alla frågor i blocket
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

            <Dialog
                open={!!answerCheckResult}
                onOpenChange={(open) => {
                    if (!open) setAnswerCheckResult(null);
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Facitkontroll</DialogTitle>
                        <DialogDescription>
                            Uttryck som kan räknas automatiskt jämförs med markerade korrekta svar.
                        </DialogDescription>
                    </DialogHeader>

                    {answerCheckResult && (
                        <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded border bg-green-50 p-3 text-green-800">
                                    <div className="text-2xl font-semibold">{answerCheckResult.checked.length}</div>
                                    <div>Kontrollerade</div>
                                </div>
                                <div className="rounded border bg-red-50 p-3 text-red-800">
                                    <div className="text-2xl font-semibold">{answerCheckResult.mismatches.length}</div>
                                    <div>Avvikelser</div>
                                </div>
                                <div className="rounded border bg-muted p-3 text-muted-foreground">
                                    <div className="text-2xl font-semibold">{answerCheckResult.unsupported.length}</div>
                                    <div>Ej kontrollerade</div>
                                </div>
                            </div>

                            {answerCheckResult.mismatches.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-medium text-red-800">Möjliga fel i facit</h3>
                                    {answerCheckResult.mismatches.map(item => (
                                        <div key={item.question.id} className="rounded border border-red-200 bg-red-50 p-3">
                                            <div className="font-medium">Fråga {item.questionNumber}</div>
                                            <MathContent value={item.question.question} />
                                            <div className="mt-1 text-red-800">
                                                Sparat facit: {item.actual}.
                                            </div>
                                            <div className="mt-1 font-medium text-green-800">
                                                Nytt facitförslag: {item.suggestion}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-3"
                                                onClick={() => {
                                                    setAnswerCheckResult(null);
                                                    openTab(
                                                        {
                                                            id: `question-${item.question.id}`,
                                                            type: "question",
                                                            title: `Uppgift #${item.question.id}`,
                                                            questionId: item.question.id
                                                        },
                                                        area
                                                    );
                                                }}
                                            >
                                                Öppna och granska
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => applyAnswerSuggestion(item)}
                                            >
                                                Ersätt facit
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {answerCheckResult.unsupported.length > 0 && (
                                <p className="text-muted-foreground">
                                    {answerCheckResult.unsupported.length} fråga/frågor kunde inte kontrolleras automatiskt, till exempel algebraiska uttryck eller textfrågor.
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAnswerCheckResult(null)}>
                            Stäng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={syncAnswerOptionsConfirmOpen}
                onOpenChange={(open) => {
                    if (!open) setSyncAnswerOptionsConfirmOpen(false);
                }}
                title="Synkronisera svarsalternativ för alla frågor i blocket?"
                description="Felmarkerade alternativ tas bort från alla numeriska uppgifter i blocket och svarsrutorna synkroniseras med kvarvarande rätta svar. Vanliga flervalsfrågor påverkas inte."
                confirmLabel="Synkronisera"
                onConfirm={runSynchronizeBlockAnswerOptions}
            />

        </>    
    );

}


