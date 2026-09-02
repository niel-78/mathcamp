import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent
} from "@/components/ui/card";

import { toast } from "sonner";

export default function LessonAssessments({
    lessonId,
    openTab
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

    useEffect(() => {

        loadAssessments();

    }, [lessonId]);

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

    }, [lessonId]);

    async function loadAssessments() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/lessons/${lessonId}/group-assessments`,
                    {
                        headers:
                            authHeaders()
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

        if (
            !window.confirm(
                "Ta bort den här lektionshändelsen?"
            )
        ) {
            return;
        }

        try {

            setDeletingId(assessmentId);

            const response =
                await fetch(
                    `${API_URL}/api/group-assessments/${assessmentId}`,
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
                            assessment.id !== assessmentId
                    )
            );

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

    return (

        <div className="space-y-2">

            <h3 className="font-medium">
                Lektionshändelser
            </h3>

            {assessments.length === 0 && (

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
                assessment => (

                    <Card
                        key={assessment.id}
                    >

                        <CardContent
                            className="
                                flex
                                items-center
                                justify-between
                                p-3
                            "
                        >

                            <div>

                                <div className="font-medium">
                                    {assessment.title}
                                </div>

                                <div
                                    className="
                                        text-xs
                                        text-muted-foreground
                                    "
                                >
                                    {assessment.type}
                                </div>

                            </div>

                            <div className="flex items-center gap-2">

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        openTab?.({
                                            id: `group-assessment-${assessment.id}`,
                                            title:
                                                assessment.title ||
                                                `Provtillfälle #${assessment.id}`,
                                            type: "group-assessment",
                                            groupExamId: assessment.id
                                        })
                                    }
                                >
                                    Öppna
                                </Button>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={deletingId === assessment.id}
                                    onClick={() =>
                                        handleDelete(assessment.id)
                                    }
                                >
                                    Ta bort
                                </Button>

                            </div>

                        </CardContent>

                    </Card>

                )
            )}

        </div>

    );

}