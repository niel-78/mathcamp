import { useEffect, useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import ExamBlock from "@/components/ui/ExamBlock";
import BlockCard from "@/components/ui/BlockCard";
import CardSection from "@/components/layouts/CardSection";
import CardGridLayout from "@/components/layouts/CardGridLayout";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DropZone from "@/components/ui/DropZone";

export default function ExamTab({
    assessmentId,
    openTab,
    assessmentTitle,
    activeDragType
}) {

    const [blocks, setBlocks] = useState([]);

    const [assessmentRole, setExamRole] = useState(null);

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
            `${API_URL}/api/assessments/${assessmentId}`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setExamRole(data.role);

    };


    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/assessments/${assessmentId}/blocks`,
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

        const response = await fetch(
            `${API_URL}/api/assessments/${assessmentId}/blocks/${blockId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        setBlocks(prev =>
            prev.filter(
                block => block.id !== blockId
            )
        );

    };

    const canEditExam = assessmentRole === "owner";

    useEffect(() => {

        loadBlocks();
        loadExam();

    }, [assessmentId]);


    useEffect(() => {

        const handler = () => {
            loadBlocks();
        };

        window.addEventListener(
            "assessment-block-added",
            handler
        );

        return () =>
            window.removeEventListener(
                "assessment-block-added",
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
                            `${API_URL}/api/assessments/${assessmentId}/blocks/${block.id}/order`,
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
            "assessment-block-moved",
            handler
        );

        return () =>
            window.removeEventListener(
                "assessment-block-moved",
                handler
            );

    }, [blocks, assessmentId]);


    return (

        <>

            <BaseTabLayout

                title={`Prov: ${assessmentTitle}`}

                actions={

                    <div className="flex gap-2">

                        <Button
                            onClick={() =>
                                setCreateBlockOpen(true)
                            }
                        >
                            Skapa eget block
                        </Button>     

                    </div>

                }

            >

                <DropZone
                    id={`assessment-${assessmentId}`}
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
                                    dragPrefix="assessment"
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

            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={setCreateBlockOpen}
                assessmentId={assessmentId}
                onCreated={loadBlocks}
            />

        </>    

    );

}