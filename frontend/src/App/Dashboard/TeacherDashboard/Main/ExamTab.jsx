import { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import ExamBlock from "@/components/ui/ExamBlock";
import BlockCard from "@/components/ui/BlockCard";
import CreateBlock from "@/components/ui/CreateBlock";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import ImportBlocksDialog from "@/components/ui/ImportBlocksDialog";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";

export default function ExamTab({
    examId,
    openTab,
    examTitle
}) {

    const [blocks, setBlocks] = useState([]);

    const { setNodeRef } = useDroppable({
        id: `exam-${examId}`
    });

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    const [
        importDialogOpen,
        setImportDialogOpen
    ] = useState(false);


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

    useEffect(() => {

        loadBlocks();

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


                <div
                    ref={setNodeRef}
                    className="
                        h-full
                        rounded-lg
                        border-2
                        border-dashed
                        border-slate-300
                        p-4
                    "
                >
                    Dra block hit...
                </div>

                <div className="border rounded-lg bg-white">

                    <div className="p-4">

                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                xl:grid-cols-3
                                gap-4
                            "
                        >

                        {blocks.map((block, index) => (

                            <ExamBlock
                                key={block.id}
                                block={block}
                            >

                                <BlockCard
                                    dragPrefix="exam"
                                    block={block}
                                    orderNumber={index + 1}
                                    onDelete={removeBlock}
                                    openTab={openTab}
                                />

                            </ExamBlock>

                        ))}


                        </div>

                    </div>


                </div>
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