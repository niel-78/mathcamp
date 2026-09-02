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

import MathContent from "@/components/ui/MathContent";

import { toast } from "sonner";

export default function LessonAssessmentDialog({
    open,
    onOpenChange,
    lessonId,
    assessmentType,
    onSaved,
    openTab,
    startDiagnosticTest
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

    const availableSections =
        diagnosticPlan?.sections ||
        [];

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

            setDiagnosticPlan(data);

            const preselectedBlockIds =
                Array.isArray(data.selected_block_ids)
                    ? data.selected_block_ids.map(Number)
                    : null;

            const nextSelected =
                (data.sections || [])
                    .filter(section =>
                        !preselectedBlockIds ||
                        (section.blocks || []).every(
                            block =>
                                preselectedBlockIds.includes(
                                    Number(block.id)
                                )
                        )
                    )
                    .map(section => Number(section.id))
                    .filter(Number.isFinite);

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

    async function handleCreateDiagnostic() {

        if (selectedBlockIds.length === 0) {

            toast.error(
                "Välj minst ett block att testa i diagnosen."
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
                            mode: "normal",
                            selected_block_ids:
                                selectedBlockIds
                        })
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

        if (selectedBlockIds.length === 0) {

            toast.error(
                "Välj minst ett block att testa i diagnosen."
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
                                selectedBlockIds
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
                        Skapa diagnos
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
                                Skapa diagnos
                            </Button>

                        </div>

                    </div>

                )}

            </DialogContent>

        </Dialog>

    );

}