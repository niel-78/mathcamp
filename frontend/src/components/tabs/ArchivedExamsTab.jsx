import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";
import DeleteExamDialog from "@/components/ui/DeleteExamDialog";

export default function ArchivedExamsTab() {

    const [assessments, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assessmentToDelete, setExamToDelete] = useState(null);

    useEffect(() => {

        loadExams();

    }, []);

    const loadExams = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/assessments`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setExams(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const restoreExam = async (
        assessmentId
    ) => {

        try {

            await fetch(
                `${API_URL}/api/archive/assessments/${assessmentId}/restore`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            window.dispatchEvent(
                new Event("assessments-changed")
            );

            await loadExams();

        } catch (error) {

            console.error(error);

        }

    };

    return (
        <>
            <BaseTabLayout
                title="Arkiverade prov"
            >

                <CardSection
                    title="Arkiverade prov"
                    description="Prov som du äger och har arkiverat."
                >

                    {loading && (

                        <div>
                            Laddar...
                        </div>

                    )}

                    {!loading &&
                    assessments.length === 0 && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Inga arkiverade prov.
                        </div>

                    )}

                    <div className="space-y-4">

                        {assessments.map(assessment => (

                            <div
                                key={assessment.id}
                                className="
                                    border
                                    rounded-lg
                                    p-4

                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                <div>

                                    <div
                                        className="
                                            font-medium
                                        "
                                    >
                                        {assessment.title}
                                    </div>

                                </div>

                                <div
                                    className="
                                        flex
                                        gap-2
                                    "
                                >

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            restoreExam(
                                                assessment.id
                                            )
                                        }
                                    >
                                        Återställ
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setExamToDelete(assessment)
                                        }
                                    >
                                        Radera
                                    </Button>

                                </div>

                            </div>

                        ))}

                    </div>

                </CardSection>

            </BaseTabLayout>

            <DeleteExamDialog
                open={!!assessmentToDelete}
                assessment={assessmentToDelete}
                onOpenChange={(open) => {

                    if (!open) {

                        setExamToDelete(null);

                    }

                }}
                onDeleted={loadExams}
            />
        </>

    );

}