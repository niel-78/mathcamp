import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent
} from "@/components/ui/card";

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

    useEffect(() => {

        loadAssessments();

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

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    openTab?.(
                                        "group-assessment",
                                        assessment.id
                                    )
                                }
                            >
                                Öppna
                            </Button>

                        </CardContent>

                    </Card>

                )
            )}

        </div>

    );

}