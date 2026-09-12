import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";

export default function TrashAssessmentsTab() {

    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAssessments = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/assessments/trash`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            setAssessments(
                await response.json()
            );

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadAssessments();

    }, []);

    const restoreAssessment = async (assessmentId) => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/assessments/${assessmentId}/restore`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            window.dispatchEvent(
                new Event("assessments-changed")
            );

            await loadAssessments();

        } catch (error) {

            console.error(error);

        }

    };

    return (
        <BaseTabLayout title="Papperskorg">
            <CardSection
                title="Papperskorg"
                description="Soft-raderade prov som kan återställas."
            >
                {loading && (
                    <div>Laddar...</div>
                )}

                {!loading && assessments.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                        Inga soft-raderade prov.
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
                                <div className="font-medium">
                                    {assessment.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Raderad: {new Date(assessment.deleted_at).toLocaleString("sv-SE")}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => restoreAssessment(assessment.id)}
                            >
                                Återställ
                            </Button>
                        </div>
                    ))}
                </div>
            </CardSection>
        </BaseTabLayout>
    );

}
