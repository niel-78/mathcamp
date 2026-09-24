import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent
} from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import LessonAssessmentDialog from "./LessonAssessmentDialog";
import DiagnosticDetailsDialog from "./DiagnosticDetailsDialog";

import { MoreVertical, ClipboardCheck, Info } from "lucide-react";

import { toast } from "sonner";

export default function LessonAssessments({
    lessonId,
    openTab,
    readOnly = false,
    isPublic = false,
    hideCompletions = false,
    startDiagnosticTest
}) {

    const [
        assessments,
        setAssessments
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        deletingId,
        setDeletingId
    ] = useState(null);

    const [
        editingAssessment,
        setEditingAssessment
    ] = useState(null);

    const [
        assessmentToDelete,
        setAssessmentToDelete
    ] = useState(null);

    const [
        diagnosticDetailsAssessment,
        setDiagnosticDetailsAssessment
    ] = useState(null);

    useEffect(() => {

        loadAssessments();

    }, [lessonId, isPublic]);

    useEffect(() => {

        const handler = () => loadAssessments();

        window.addEventListener(
            "lesson-section-added",
            handler
        );

        return () => {
            window.removeEventListener(
                "lesson-section-added",
                handler
            );
        };

    }, [lessonId, isPublic]);

    async function loadAssessments() {

        try {
            const endpoint = isPublic
                ? `${API_URL}/api/public/lessons/${lessonId}/group-assessments`
                : `${API_URL}/api/lessons/${lessonId}/group-assessments`;

            const response =
                await fetch(
                    endpoint,
                    {
                        headers: isPublic
                            ? {}
                            : authHeaders()
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Kunde inte hämta assessments."
                );
            }

            const data =
                await response.json();

            setAssessments(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    async function handleDelete(assessmentId) {

        const assessment =
            assessments.find(
                item => item.id === assessmentId
            );

        setAssessmentToDelete(assessment);

    }

    async function confirmDelete() {

        if (!assessmentToDelete) {
            return;
        }

        try {

            setDeletingId(assessmentToDelete.id);

            const response =
                await fetch(
                    `${API_URL}/api/group-assessments/${assessmentToDelete.id}`,
                    {
                        method: "DELETE",
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Kunde inte ta bort lektionshändelsen."
                );
            }

            setAssessments(
                previous =>
                    previous.filter(
                        assessment =>
                            assessment.id !== assessmentToDelete.id
                    )
            );

            setAssessmentToDelete(null);

        } catch (error) {

            console.error(error);

            toast.error(
                error.message
            );

        } finally {

            setDeletingId(null);

        }

    }

    if (loading) {

        return (
            <div className="text-sm text-muted-foreground">
                Laddar assessments...
            </div>
        );

    }

    if (readOnly && assessments.length === 0) {
        return null;
    }

    return (
        <>

        <div className="space-y-2">

            {!readOnly && (
                <h3 className="font-medium">
                    Lektionshändelser
                </h3>
            )}

            {!readOnly && assessments.length === 0 && (

                <div
                    className="
                        rounded-md
                        border
                        p-3
                        text-sm
                        text-muted-foreground
                    "
                >
                    Inga Lektionshändelser kopplade.
                </div>

            )}

            {assessments.map(
                assessment => {
                    const isDiagnostic = assessment.type === "diagnostic";

                    return (
                        <Card
                            key={assessment.id}
                            className={
                                isDiagnostic
                                    ? "cursor-pointer hover:border-primary hover:bg-primary/5 transition"
                                    : ""
                            }
                            onClick={() => {
                                if (isDiagnostic) {
                                    setDiagnosticDetailsAssessment(assessment);
                                }
                            }}
                        >
                            <CardContent
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    p-3
                                "
                            >
                                <div className="space-y-0.5">
                                    <div className="font-semibold text-sm flex items-center gap-2">
                                        {isDiagnostic ? (
                                            <>
                                                <span className="text-foreground font-bold">Diagnos</span>
                                                {assessment.title &&
                                                    assessment.title !== "Diagnos" &&
                                                    assessment.title !== "Diagnostiskt prov" && (
                                                        <span className="text-xs text-muted-foreground font-normal">
                                                            ({assessment.title})
                                                        </span>
                                                    )}
                                            </>
                                        ) : (
                                            <span>{assessment.title}</span>
                                        )}
                                    </div>

                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        {isDiagnostic ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-primary/80">
                                                <Info size={12} /> Klicka för att se ingående sidor
                                            </span>
                                        ) : (
                                            <span>{assessment.type}</span>
                                        )}
                                    </div>
                                </div>

                                {!readOnly && (
                                    <div
                                        className="flex items-center gap-2"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                className="
                                                    inline-flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-md
                                                    hover:bg-accent
                                                "
                                            >
                                                <MoreVertical size={16} />
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                {isDiagnostic && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setDiagnosticDetailsAssessment(assessment)
                                                        }
                                                    >
                                                        Visa information & sidor
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openTab?.({
                                                            id: `group-assessment-${assessment.id}`,
                                                            title:
                                                                assessment.title ||
                                                                `Provtillfälle #${assessment.id}`,
                                                            type: "group-assessment",
                                                            groupExamId: assessment.id,
                                                            assessmentType: assessment.type
                                                        })
                                                    }
                                                >
                                                    Öppna
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setEditingAssessment(assessment)
                                                    }
                                                >
                                                    Redigera
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    disabled={deletingId === assessment.id}
                                                    onClick={() =>
                                                        handleDelete(assessment.id)
                                                    }
                                                >
                                                    Ta bort
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                }
            )}

        </div>

        <DiagnosticDetailsDialog
            open={!!diagnosticDetailsAssessment}
            onOpenChange={open => {
                if (!open) {
                    setDiagnosticDetailsAssessment(null);
                }
            }}
            assessment={diagnosticDetailsAssessment}
            lessonId={lessonId}
            isPublic={isPublic}
            hideCompletions={hideCompletions || isPublic}
        />

        <Dialog
            open={!!assessmentToDelete}
            onOpenChange={(open) => {
                if (!open) {
                    setAssessmentToDelete(null);
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Ta bort lektionshändelse
                    </DialogTitle>
                </DialogHeader>

                <p>
                    Vill du ta bort
                    {" "}
                    <strong>
                        {assessmentToDelete?.title || "denna lektionshändelse"}
                    </strong>
                    ?
                </p>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => setAssessmentToDelete(null)}
                    >
                        Avbryt
                    </Button>

                    <Button
                        variant="destructive"
                        disabled={deletingId === assessmentToDelete?.id}
                        onClick={confirmDelete}
                    >
                        Ta bort
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <LessonAssessmentDialog
            open={!!editingAssessment}
            onOpenChange={(open) => {
                if (!open) {
                    setEditingAssessment(null);
                }
            }}
            lessonId={lessonId}
            assessmentType={editingAssessment?.type || "diagnostic"}
            groupAssessmentId={editingAssessment?.id || null}
            initialAssessment={editingAssessment}
            onSaved={async () => {
                setEditingAssessment(null);
                await loadAssessments();
            }}
            openTab={openTab}
            startDiagnosticTest={startDiagnosticTest}
        />

        </>

    );

}