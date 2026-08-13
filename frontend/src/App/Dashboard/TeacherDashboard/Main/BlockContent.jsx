import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { toast } from "sonner";
import ArchiveQuestionDialog from "@/components/ui/ArchiveQuestionDialog";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";    
import MathContent from "@/components/ui/MathContent";

export default function BlockContent({
    block,
    area,
    openTab
}) {

    const [currentBlock, setCurrentBlock] = useState(block);    

    const [questionToArchive, setQuestionToArchive] = useState(null);

    useEffect(() => {
        setCurrentBlock(block);
    }, [block]);

    useEffect(() => {
        loadBlock();
    }, [block.id]);

    const loadBlock = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/${block.id}/`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();
        setCurrentBlock(data);
        console.log(data);

    };

    const createQuestion = async () => {

        const lastQuestion =
            currentBlock.questions[
                currentBlock.questions.length - 1
            ];

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
                    answer_config:
                        lastQuestion?.answer_config ??
                        {}
                })
            }
        );

        if (!response.ok) {

            const text = await response.text();

            toast.error(text);

            return;
        }

        await loadBlock();

        toast.success(
            "Uppgift skapad"
        );

    };

    const duplicateQuestion =
        async (questionId) => {

            await fetch(
                `${API_URL}/api/questions/${questionId}/duplicate`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            await loadBlock();

            toast.success(
                "Uppgift duplicerad"
            );
        };


    return (
        <>
            <BaseTabLayout
                title={`Block #${currentBlock.id}`}
                actions={
                    <Button
                        onClick={createQuestion}
                    >
                        Ny uppgift
                    </Button>
                }
            >
                <div className="space-y-2">


                    {currentBlock?.questions?.map(question => (

                        <div
                            key={question.id}
                            className="
                                border
                                p-2
                                rounded
                                flex
                                justify-between
                                items-center
                            "
                        >

                            <MathContent value={question.question} />

                            <div className="flex gap-2">

                                <Button
                                    size="sm"
                                    onClick={() =>
                                        openTab(
                                            {
                                                id: `question-${question.id}`,
                                                type: "question",
                                                title: `Uppgift #${question.id}`,
                                                questionId: question.id
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


        </>    
    );

}


