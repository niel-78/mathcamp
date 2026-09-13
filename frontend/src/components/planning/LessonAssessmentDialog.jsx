import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import {
    Button
} from "@/components/ui/button";

import {
    Input
} from "@/components/ui/input";

import {
    Switch
} from "@/components/ui/switch";

import MathContent from "@/components/ui/MathContent";

import { toast } from "sonner";

export default function LessonAssessmentDialog({
    open,
    onOpenChange,
    lessonId,
    assessmentType,
    onSaved,
    openTab,
    startDiagnosticTest,
    groupAssessmentId = null,
    initialAssessment = null
}) {

    const [
        saving,
        setSaving
    ] = useState(false);

    const [
        loading,
        setLoading
    ] = useState(false);

    const [
        diagnosticPlan,
        setDiagnosticPlan
    ] = useState(null);

    const [
        selectedSectionIds,
        setSelectedSectionIds
    ] = useState([]);

    const [
        abilityQuestionCounts,
        setAbilityQuestionCounts
    ] = useState({});

    const [
        completionQuestionsPerAbility,
        setCompletionQuestionsPerAbility
    ] = useState(1);

    const [
        trainingQuestionsPerAbility,
        setTrainingQuestionsPerAbility
    ] = useState(1);

    const [includeCompletion, setIncludeCompletion] = useState(true);
    const [includeTraining, setIncludeTraining] = useState(true);

    const isEditMode = !!groupAssessmentId;

    const availableSections =
        [...(diagnosticPlan?.sections || [])].sort((a, b) => {
            const pageA = a.pageNumber != null ? Number(a.pageNumber) : -1;
            const pageB = b.pageNumber != null ? Number(b.pageNumber) : -1;
            if (pageB !== pageA) {
                return pageB - pageA;
            }
            return (a.name || "").localeCompare(b.name || "", "sv");
        });

    const availableSectionIds =
        availableSections
            .map(section => Number(section.id))
            .filter(Number.isFinite);

    const allSectionsSelected =
        availableSectionIds.length > 0 &&
        availableSectionIds.every(
            sectionId =>
                selectedSectionIds.includes(sectionId)
        );

    const selectedBlockIds =
        availableSections
            .filter(
                section =>
                    selectedSectionIds.includes(
                        Number(section.id)
                    )
            )
            .flatMap(
                section =>
                    (section.blocks || [])
                        .map(block => Number(block.id))
            )
            .filter(Number.isFinite);

    const selectedAbilities =
        (diagnosticPlan?.abilities || []).filter(
            ability =>
                (ability.section_ids || []).some(
                    sId => selectedSectionIds.includes(Number(sId))
                )
        );

    const totalSeedQuestions =
        selectedAbilities.reduce((sum, ability) => {
            const count = Number(
                abilityQuestionCounts[ability.id] ??
                (diagnosticPlan?.defaultQuestionsPerAbility ?? 1)
            );
            return sum + (Number.isFinite(count) && count > 0 ? count : 0);
        }, 0);

    useEffect(() => {

        if (
            !open ||
            assessmentType !==
                "diagnostic"
        ) {
            return;
        }

        loadDiagnosticPlan();

    }, [
        open,
        assessmentType,
        lessonId
    ]);

    async function loadDiagnosticPlan() {

        try {

            setLoading(true);

            const response =
                await fetch(
                    `${API_URL}/api/lessons/${lessonId}/diagnostic-preview`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "Kunde inte läsa diagnosplan."
                );

            }

            const data =
                await response.json();

            let existingConfig = null;

            if (groupAssessmentId) {

                const existingResponse =
                    await fetch(
                        `${API_URL}/api/group-assessments/${groupAssessmentId}`,
                        {
                            headers: authHeaders()
                        }
                    );

                if (existingResponse.ok) {
                    const existingData =
                        await existingResponse.json();

                    existingConfig =
                        typeof existingData.config === "string"
                            ? JSON.parse(existingData.config || "{}")
                            : (existingData.config || {});
                }

            }

            setDiagnosticPlan(data);

            const defaultQuestions =
                data.defaultQuestionsPerAbility ?? 1;

            const defaultCompletion =
                data.defaultCompletionQuestionsPerAbility ?? 1;

            const defaultTraining =
                data.defaultTrainingQuestionsPerAbility ?? 1;

            const initialCounts = {};
            (data.abilities || []).forEach(ability => {
                initialCounts[ability.id] = defaultQuestions;
            });

            if (existingConfig?.ability_question_counts) {

                Object.entries(existingConfig.ability_question_counts).forEach(([abilityId, count]) => {
                    const number = Number(count);
                    if (Number.isFinite(number) && number > 0) {
                        initialCounts[Number(abilityId)] = number;
                    }
                });

            }

            setAbilityQuestionCounts(initialCounts);
            setCompletionQuestionsPerAbility(
                existingConfig?.attempt?.completionQuestionsPerAbility ??
                existingConfig?.completion_questions_per_ability ??
                defaultCompletion
            );
            setTrainingQuestionsPerAbility(
                existingConfig?.attempt?.trainingQuestionsPerAbility ??
                existingConfig?.training_questions_per_ability ??
                defaultTraining
            );
            setIncludeCompletion(
                existingConfig?.attempt?.includeCompletion ??
                existingConfig?.include_completion ??
                data.defaultIncludeCompletion ??
                true
            );
            setIncludeTraining(
                existingConfig?.attempt?.includeTraining ??
                existingConfig?.include_training ??
                data.defaultIncludeTraining ??
                true
            );

            const preselectedBlockIds =
                Array.isArray(existingConfig?.selected_block_ids)
                    ? existingConfig.selected_block_ids.map(Number)
                    : (Array.isArray(data.selected_block_ids)
                        ? data.selected_block_ids.map(Number)
                        : null);

            const previouslyIncludedSectionIdSet = new Set(
                (data.previouslyIncludedSectionIds || [])
                    .map(Number)
            );

            let nextSelected =
                (data.sections || [])
                    .filter(section => {
                        const sectionId = Number(section.id);
                        if (
                            section.previouslyIncluded ||
                            previouslyIncludedSectionIdSet.has(sectionId)
                        ) {
                            return false;
                        }
                        if (preselectedBlockIds) {
                            return (section.blocks || []).every(
                                block =>
                                    preselectedBlockIds.includes(
                                        Number(block.id)
                                    )
                            );
                        }
                        return true;
                    })
                    .map(section => Number(section.id))
                    .filter(Number.isFinite);

            if (groupAssessmentId && Array.isArray(existingConfig?.selected_block_ids)) {

                const selectedSectionSet = new Set();

                (data.sections || []).forEach(section => {
                    const sectionBlockIds = (section.blocks || []).map(block => Number(block.id));
                    if (
                        sectionBlockIds.length > 0 &&
                        sectionBlockIds.every(blockId =>
                            existingConfig.selected_block_ids
                                .map(Number)
                                .includes(blockId)
                        )
                    ) {
                        selectedSectionSet.add(Number(section.id));
                    }
                });

                nextSelected = Array.from(selectedSectionSet);

            }

            setSelectedSectionIds(nextSelected);

        } catch (error) {

            console.error(error);

            toast.error(
                error.message
            );

        } finally {

            setLoading(false);

        }

    }

    function toggleSection(sectionId) {

        setSelectedSectionIds(
            previous => {

                const next =
                    previous.includes(sectionId)
                        ? previous.filter(id => id !== sectionId)
                        : [...previous, sectionId];

                return next;

            }
        );

    }

    function updateAbilityCount(abilityId, value) {

        setAbilityQuestionCounts(previous => ({
            ...previous,
            [abilityId]: value === "" ? "" : Number(value)
        }));

    }

    async function handleCreateDiagnostic() {

        const normalizedAbilityCounts = {};
        for (const ability of selectedAbilities) {
            const count =
                abilityQuestionCounts[ability.id] !== undefined
                    ? Number(abilityQuestionCounts[ability.id])
                    : (diagnosticPlan?.defaultQuestionsPerAbility ?? 1);

            if (!Number.isInteger(count) || count < 1) {
                toast.error(
                    `Ange ett giltigt antal uppgifter (minst 1) för förmågan "${ability.name}".`
                );
                return;
            }

            normalizedAbilityCounts[ability.id] = count;
        }

        const normalizedCompletionCount =
            Number(completionQuestionsPerAbility);

        if (
            includeCompletion &&
            !Number.isInteger(normalizedCompletionCount) ||
            includeCompletion && normalizedCompletionCount < 1
        ) {
            toast.error(
                "Ange minst 1 uppgift per förmåga i komplettering."
            );
            return;
        }

        const normalizedTrainingCount =
            Number(trainingQuestionsPerAbility);

        if (
            includeTraining &&
            (!Number.isInteger(normalizedTrainingCount) ||
            normalizedTrainingCount < 1)
        ) {
            toast.error(
                "Ange minst 1 uppgift per förmåga i träning."
            );
            return;
        }

        const payload = {
            type: "diagnostic",
            mode: "normal",
            selected_block_ids:
                selectedBlockIds,
            ability_question_counts:
                normalizedAbilityCounts,
            completion_questions_per_ability:
                normalizedCompletionCount,
            training_questions_per_ability:
                normalizedTrainingCount,
            include_completion:
                includeCompletion,
            include_training:
                includeTraining
        };

        try {

            setSaving(true);

            if (isEditMode && groupAssessmentId) {

                const response =
                    await fetch(
                        `${API_URL}/api/group-assessments/${groupAssessmentId}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                ...authHeaders()
                            },
                            body: JSON.stringify({
                                config: payload,
                                waiting_room_open: false,
                                available_from: null,
                                available_until: null
                            })
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Kunde inte uppdatera diagnosen."
                    );
                }

                toast.success("Diagnosen uppdaterades.");

            } else {

                const response =
                    await fetch(
                        `${API_URL}/api/lessons/${lessonId}/group-assessments`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                ...authHeaders()
                            },
                            body: JSON.stringify(payload)
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Kunde inte skapa diagnos."
                    );

                }

                toast.success(
                    "Diagnos skapad."
                );

            }

            window.dispatchEvent(
                new Event(
                    "lesson-section-added"
                )
            );

            onSaved?.();

            onOpenChange(false);

        } catch (error) {

            toast.error(
                error.message
            );

        } finally {

            setSaving(false);

        }

    }

    async function handleTestDiagnostic() {

        const normalizedAbilityCounts = {};
        for (const ability of selectedAbilities) {
            const count =
                abilityQuestionCounts[ability.id] !== undefined
                    ? Number(abilityQuestionCounts[ability.id])
                    : (diagnosticPlan?.defaultQuestionsPerAbility ?? 1);

            if (!Number.isInteger(count) || count < 1) {
                toast.error(
                    `Ange ett giltigt antal uppgifter (minst 1) för förmågan "${ability.name}".`
                );
                return;
            }

            normalizedAbilityCounts[ability.id] = count;
        }

        const normalizedCompletionCount =
            Number(completionQuestionsPerAbility);

        if (
            includeCompletion &&
            !Number.isInteger(normalizedCompletionCount) ||
            includeCompletion && normalizedCompletionCount < 1
        ) {
            toast.error(
                "Ange minst 1 uppgift per förmåga i komplettering."
            );
            return;
        }

        const normalizedTrainingCount =
            Number(trainingQuestionsPerAbility);

        if (
            includeTraining &&
            (!Number.isInteger(normalizedTrainingCount) ||
            normalizedTrainingCount < 1)
        ) {
            toast.error(
                "Ange minst 1 uppgift per förmåga i träning."
            );
            return;
        }

        try {

            setSaving(true);

            const response =
                await fetch(
                    `${API_URL}/api/lessons/${lessonId}/group-assessments`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            ...authHeaders()
                        },
                        body: JSON.stringify({
                            type: "diagnostic",
                            mode: "test",
                            selected_block_ids:
                                selectedBlockIds,
                            ability_question_counts:
                                normalizedAbilityCounts,
                            completion_questions_per_ability:
                                normalizedCompletionCount,
                            training_questions_per_ability:
                                normalizedTrainingCount,
                            include_completion:
                                includeCompletion,
                            include_training:
                                includeTraining
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Kunde inte skapa testdiagnos."
                );

            }

            const startResponse =
                await fetch(
                    `${API_URL}/api/assessment-attempts/start`,
                    {
                        method: "POST",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            group_assessment_id:
                                data.group_assessment_id
                        })
                    }
                );

            const startData =
                await startResponse.json();

            if (!startResponse.ok) {

                throw new Error(
                    startData.error ||
                    "Kunde inte starta testdiagnosen."
                );

            }

            console.log(
                "Opening attempt:",
                startData.attempt_id
            );

            console.log(
                "startDiagnosticTest:",
                startDiagnosticTest
            );

            startDiagnosticTest?.(
                startData.attempt_id
            );

            onOpenChange(false);

        } catch (error) {

            toast.error(
                error.message
            );

        } finally {

            setSaving(false);

        }

    }


    if (
        assessmentType !==
        "diagnostic"
    ) {

        return null;

    }

    return (

        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >

            <DialogContent
                className="
                    max-w-2xl
                "
            >

                <DialogHeader>

                    <DialogTitle>
                        {isEditMode ? "Redigera diagnos" : "Skapa diagnos"}
                    </DialogTitle>

                </DialogHeader>

                {loading && (

                    <div
                        className="
                            text-sm
                            text-muted-foreground
                        "
                    >
                        Analyserar
                        planeringen...
                    </div>

                )}

                {!loading &&
                diagnosticPlan && (

                    <div
                        className="
                            space-y-4
                        "
                    >

                        <div
                            className="
                                rounded-md
                                border
                                p-3
                                text-sm
                            "
                        >

                            <div
                                className="
                                    font-medium
                                "
                            >
                                Senaste diagnos
                            </div>

                            <div
                                className="
                                    text-muted-foreground
                                "
                            >
                                {
                                    diagnosticPlan
                                        .lastDiagnosticDate
                                }
                            </div>

                        </div>

                        <div>

                            <div
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >
                                <div className="font-medium">
                                    Välj vilka sektioner som ska ingå i diagnosen
                                </div>

                                {availableSections.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedSectionIds(availableSectionIds)}
                                        >
                                            {allSectionsSelected ? "Alla valda" : "Markera alla"}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedSectionIds([])}
                                        >
                                            Rensa
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {availableSections.length === 0 && (
                                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                                    Inga sektioner hittades i planeringen för lektioner fram till och med den här lektionen. Lägg till block i sektioner först så att diagnosen kan byggas.
                                </div>
                            )}

                            {availableSections.length > 0 && (
                                <div
                                    className="
                                        space-y-2
                                    "
                                >

                                    {availableSections.map(
                                        section => {

                                            const sectionId = Number(section.id);
                                            const isSelected = selectedSectionIds.includes(sectionId);

                                            return (
                                                <label
                                                    key={section.id}
                                                    className="
                                                        flex
                                                        cursor-pointer
                                                        items-center
                                                        justify-between
                                                        gap-2
                                                        rounded-md
                                                        border
                                                        bg-background
                                                        px-2
                                                        py-1
                                                        text-sm
                                                        shadow-sm
                                                    "
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                        "
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 accent-primary"
                                                            style={{ appearance: "checkbox" }}
                                                            checked={isSelected}
                                                            onChange={() => toggleSection(sectionId)}
                                                        />
                                                        <MathContent value={section.name} />
                                                        {section.previouslyIncluded && (
                                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                                                Tidigare testad
                                                            </span>
                                                        )}
                                                    </div>

                                                    {section.pageNumber != null && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Sid {section.pageNumber}
                                                        </span>
                                                    )}
                                                </label>
                                            );

                                        }
                                    )}

                                </div>
                            )}

                        </div>

                        {selectedAbilities.length === 0 && (
                            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground bg-muted/20">
                                Inga nya sektioner är valda. Diagnosen startar direkt med komplettering och träning av tidigare förmågor.
                            </div>
                        )}

                        {selectedAbilities.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">
                                        Antal uppgifter per förmåga
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Totalt {totalSeedQuestions} uppgifter i basdelen
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    Standardvärdet ({diagnosticPlan?.defaultQuestionsPerAbility ?? 1}) är hämtat från inställningarna. Du kan justera antalet uppgifter för varje förmåga nedan.
                                </div>

                                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2 bg-muted/10">
                                    {selectedAbilities.map(ability => {
                                        const val =
                                            abilityQuestionCounts[ability.id] !== undefined
                                                ? abilityQuestionCounts[ability.id]
                                                : (diagnosticPlan?.defaultQuestionsPerAbility ?? 1);

                                        return (
                                            <div
                                                key={ability.id}
                                                className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                                            >
                                                <span className="font-medium truncate" title={ability.name}>
                                                    {ability.name}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={val}
                                                        onChange={event =>
                                                            updateAbilityCount(
                                                                ability.id,
                                                                event.target.value
                                                            )
                                                        }
                                                        className="h-8 w-20 text-center"
                                                    />
                                                    <span className="text-xs text-muted-foreground">st</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 rounded-md border p-3 bg-muted/10">
                            <label
                                htmlFor="diagnostic-completion-questions-count"
                                className="text-sm font-medium"
                            >
                                Antal uppgifter per förmåga i komplettering (adaptiv del)
                            </label>

                            <div className="flex items-center gap-3">
                                <Input
                                    id="diagnostic-completion-questions-count"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={completionQuestionsPerAbility}
                                    onChange={event =>
                                        setCompletionQuestionsPerAbility(
                                            event.target.value === ""
                                                ? ""
                                                : Number(event.target.value)
                                        )
                                    }
                                    className="h-8 w-24 text-center"
                                    disabled={!includeCompletion}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Standardvärde: {diagnosticPlan?.defaultCompletionQuestionsPerAbility ?? 1} st
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 rounded-md border p-3 bg-muted/10">
                            <label
                                htmlFor="diagnostic-training-questions-count"
                                className="text-sm font-medium"
                            >
                                Antal uppgifter per förmåga i träning (adaptiv del)
                            </label>

                            <div className="flex items-center gap-3">
                                <Input
                                    id="diagnostic-training-questions-count"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={trainingQuestionsPerAbility}
                                    onChange={event =>
                                        setTrainingQuestionsPerAbility(
                                            event.target.value === ""
                                                ? ""
                                                : Number(event.target.value)
                                        )
                                    }
                                    className="h-8 w-24 text-center"
                                    disabled={!includeTraining}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Standardvärde: {diagnosticPlan?.defaultTrainingQuestionsPerAbility ?? 1} st
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-md border p-3">
                            <label className="flex items-center justify-between gap-4 text-sm font-medium">
                                <span>Inkludera komplettering</span>
                                <Switch
                                    checked={includeCompletion}
                                    onCheckedChange={setIncludeCompletion}
                                />
                            </label>

                            <label className="flex items-center justify-between gap-4 text-sm font-medium">
                                <span>Inkludera träning</span>
                                <Switch
                                    checked={includeTraining}
                                    onCheckedChange={setIncludeTraining}
                                />
                            </label>
                        </div>

                        <div
                            className="
                                rounded-md
                                border
                                bg-muted/30
                                p-3
                                text-sm
                            "
                        >
                            Efter dessa
                            block tar den
                            adaptiva delen
                            över och väljer
                            frågor utifrån
                            elevens resultat.
                        </div>

                        <div
                            className="
                                flex
                                justify-end
                                gap-2
                            "
                        >

                            <Button
                                variant="outline"
                                onClick={
                                    handleTestDiagnostic
                                }
                            >
                                Testa diagnosen
                            </Button>

                            <Button
                                disabled={saving}
                                onClick={
                                    handleCreateDiagnostic
                                }
                            >
                                {isEditMode ? "Spara ändringar" : "Skapa diagnos"}
                            </Button>

                        </div>

                    </div>

                )}

            </DialogContent>

        </Dialog>

    );

}