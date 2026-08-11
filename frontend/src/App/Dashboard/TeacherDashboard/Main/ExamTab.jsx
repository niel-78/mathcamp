import { useEffect, useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import ExamBlock from "@/components/ui/ExamBlock";
import BlockCard from "@/components/ui/BlockCard";
import CardSection from "@/components/layouts/CardSection";
import CardGridLayout from "@/components/layouts/CardGridLayout";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import ImportBlocksDialog from "@/components/ui/ImportBlocksDialog";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DropZone from "@/components/ui/DropZone";

export default function ExamTab({
    examId,
    openTab,
    examTitle,
    activeDragType
}) {

    const [blocks, setBlocks] = useState([]);

    const [examRole, setExamRole] = useState(null);

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    const [
        importDialogOpen,
        setImportDialogOpen
    ] = useState(false);

    const loadExam = async () => {

        const response = await fetch(
            `${API_URL}/api/exams/${examId}`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setExamRole(data.role);

    };


    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/exams/${examId}/blocks`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setBlocks(
            data.sort(
                (a, b) =>
                    a.sort_order -
                    b.sort_order
            )
        );

    };

    const removeBlock = async (blockId) => {

        console.log("REMOVE", blockId);

        const response = await fetch(
            `${API_URL}/api/exams/${examId}/blocks/${blockId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        console.log("STATUS", response.status);

        setBlocks(prev =>
            prev.filter(
                block => block.id !== blockId
            )
        );

    };

    const canEditExam = examRole === "owner";

    useEffect(() => {

        loadBlocks();
        loadExam();

    }, [examId]);


    useEffect(() => {

        const handler = () => {
            loadBlocks();
        };

        window.addEventListener(
            "exam-block-added",
            handler
        );

        return () =>
            window.removeEventListener(
                "exam-block-added",
                handler
            );

    }, []);


    useEffect(() => {

        const handler = async (event) => {

            const {
                draggedId,
                targetId
            } = event.detail;

            const oldIndex =
                blocks.findIndex(
                    b => b.id === draggedId
                );

            const newIndex =
                blocks.findIndex(
                    b => b.id === targetId
                );

            if (
                oldIndex === -1 ||
                newIndex === -1
            ) {
                return;
            }

            const reordered = [...blocks];

            const [moved] =
                reordered.splice(
                    oldIndex,
                    1
                );

            reordered.splice(
                newIndex,
                0,
                moved
            );

            setBlocks(reordered);

            await Promise.all(

                reordered.map(
                    (block, index) =>

                        fetch(
                            `${API_URL}/api/exams/${examId}/blocks/${block.id}/order`,
                            {
                                method: "PUT",
                                headers: {
                                    ...authHeaders(),
                                    "Content-Type":
                                        "application/json"
                                },
                                body: JSON.stringify({
                                    sort_order:
                                        index + 1
                                })
                            }
                        )

                )

            );

        };

        window.addEventListener(
            "exam-block-moved",
            handler
        );

        return () =>
            window.removeEventListener(
                "exam-block-moved",
                handler
            );

    }, [blocks, examId]);


    return (

        <>

            <BaseTabLayout

                title={`Prov: ${examTitle}`}

                actions={

                    <div className="flex gap-2">

                        <Button
                            onClick={() =>
                                setCreateBlockOpen(true)
                            }
                        >
                            Skapa eget block
                        </Button>     
                        
                        
                        <Button
                            variant="outline"
                            onClick={() =>
                                setImportDialogOpen(true)
                            }
                        >
                            Importera block (uu)
                        </Button>

                    </div>

                }

            >

                <DropZone
                    id={`exam-${examId}`}
                    text="Dra block hit för att lägga till dem i provet"
                />

                <CardSection
                    title="Provblock"
                    description="Block som ingår i provet."
                >
                    <CardGridLayout
                        minCardWidth={500}
                    >

                        {blocks.map((block, index) => (

                            <ExamBlock
                                key={block.id}
                                block={block}
                                activeDragType={activeDragType}
                            >

                                <BlockCard
                                    dragPrefix="exam"
                                    block={block}
                                    orderNumber={index + 1}
                                    onDelete={removeBlock}
                                    canRemoveFromExam={canEditExam}
                                    openTab={openTab}
                                />

                            </ExamBlock>

                        ))}

                    </CardGridLayout>

                </CardSection>

            </BaseTabLayout>


            <ImportBlocksDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                examId={examId}
                onImported={loadBlocks}
            />

            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={setCreateBlockOpen}
                examId={examId}
                onCreated={loadBlocks}
            />

        </>    

    );

}