import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import DeleteQuestionDialog from "@/components/ui/DeleteQuestionDialog";
import { Button } from "@/components/ui/button";

export default function ArchivedQuestionsTab() {

    const [questions, setQuestions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [questionToDelete,
        setQuestionToDelete] =
        useState(null);

    useEffect(() => {

        loadQuestions();

    }, []);

    const loadQuestions = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/questions`,
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

            setQuestions(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const restoreQuestion = async (
        questionId
    ) => {

        try {

            await fetch(
                `${API_URL}/api/archive/questions/${questionId}/restore`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            window.dispatchEvent(
                new Event("questions-changed")
            );

            await loadQuestions();

        } catch (error) {

            console.error(error);

        }

    };

    const deleteQuestion = async () => {

        if (!questionToDelete) {
            return;
        }

        try {

            await fetch(
                `${API_URL}/api/archive/questions/${questionToDelete.id}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            setQuestionToDelete(null);

            await loadQuestions();

        } catch (error) {

            console.error(error);

        }

    };


    return (

        <>
            <BaseTabLayout
                title="Arkiverade uppgifter"
            >

                <CardSection
                    title="Arkiverade uppgifter"
                    description="Uppgifter från dina block som har arkiverats."
                >

                    {loading && (

                        <div>
                            Laddar...
                        </div>

                    )}

                    {!loading &&
                    questions.length === 0 && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Inga arkiverade uppgifter.
                        </div>

                    )}

                    <div className="space-y-4">

                        {questions.map(question => (

                            <div
                                key={question.id}
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
                                        Uppgift #{question.id}
                                    </div>

                                    <div
                                        className="
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >
                                        Block:
                                        {" "}
                                        {question.block_id}
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
                                            restoreQuestion(
                                                question.id
                                            )
                                        }
                                    >
                                        Återställ
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setQuestionToDelete(
                                                question
                                            )
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

            <DeleteQuestionDialog
                open={!!questionToDelete}
                onOpenChange={(open) => {

                    if (!open) {

                        setQuestionToDelete(null);

                    }

                }}
                onDelete={deleteQuestion}
            />

        </>
    );

}