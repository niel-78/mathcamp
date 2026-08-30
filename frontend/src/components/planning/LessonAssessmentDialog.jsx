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

        } catch (error) {

            console.error(error);

            toast.error(
                error.message
            );

        } finally {

            setLoading(false);

        }

    }

    async function handleCreateDiagnostic() {

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
                            mode: "normal"
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
                            mode: "test"
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
                                    font-medium
                                "
                            >
                                Diagnosen
                                kommer att
                                börja med:
                            </div>

                            <div
                                className="
                                    space-y-4
                                "
                            >

                                {diagnosticPlan.sections
                                    ?.map(
                                        section => (

                                            <div
                                                key={
                                                    section.id
                                                }
                                            >

                                                <div
                                                    className="
                                                        font-medium
                                                    "
                                                >
                                                    {
                                                        section.name
                                                    }
                                                </div>

                                                <ul
                                                    className="
                                                        ml-5
                                                        list-disc
                                                        text-sm
                                                    "
                                                >

                                                    {diagnosticPlan.questions
                                                        ?.filter(
                                                            q =>
                                                                Number(
                                                                    q.section_id
                                                                ) ===
                                                                Number(
                                                                    section.id
                                                                )
                                                        )
                                                        .map(
                                                            q => (

                                                                <li
                                                                    key={
                                                                        q.block_id
                                                                    }
                                                                >
                                                                    {
                                                                        q.block_name
                                                                    }
                                                                </li>

                                                            )
                                                        )}

                                                </ul>

                                            </div>

                                        )
                                    )}

                            </div>

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