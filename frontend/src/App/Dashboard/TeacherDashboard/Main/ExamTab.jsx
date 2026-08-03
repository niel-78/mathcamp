import { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import ExamBlock from "@/components/ui/ExamBlock";
import BlockCard from "@/components/ui/BlockCard";
import CreateBlock from "@/components/ui/CreateBlock";

export default function ExamTab({
    examId
}) {

    const [blocks, setBlocks] = useState([]);

    const { setNodeRef } = useDroppable({
        id: `exam-${examId}`
    });

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
                    a.order_by -
                    b.order_by
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
                                    order_by:
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

            <CreateBlock
                examId={examId}
                onCreated={loadBlocks}
            />    

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
                            />

                        </ExamBlock>

                    ))}


                    </div>

                </div>


            </div>
        </>

    );

}