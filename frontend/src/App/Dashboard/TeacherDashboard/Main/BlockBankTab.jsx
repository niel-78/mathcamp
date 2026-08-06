import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import BlockLibrary from "@/components/ui/BlockLibrary";
import BlockFilter from "@/components/ui/BlockFilter";
import DeleteBlockDialog from "@/components/ui/DeleteBlockDialog";


export default function BlockBankTab({
    openTab,
    blockRefreshKey
}) {

    const [blocks, setBlocks] = useState([]);
    const [blockToDelete, setBlockToDelete] = useState(null);

    const [subjectId, setSubjectId] =
        useState("");

    const [levelId, setLevelId] =
        useState("");

    const [areaId, setAreaId] =
        useState("");

    const [
        centralContentId,
        setCentralContentId
    ] = useState("");

    useEffect(() => {
        loadBlocks();
    }, [blockRefreshKey]);

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    const loadBlocks = async () => {

        const res = await fetch(
            `${API_URL}/api/blocks/`,
            {
                headers: authHeaders()
            }
        );

        const data = await res.json();
        setBlocks(data);

    };

    const deleteBlock = async () => {

        await fetch(
            `${API_URL}/api/blocks/${blockToDelete}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        setBlockToDelete(null);

        loadBlocks();

    };

    const filteredBlocks =
        blocks.filter(block => {

        const matchesSubject =
            !subjectId ||
            block.subjects?.some(
                subject =>
                    subject.id === Number(subjectId)
            );

        const matchesLevel =
            !levelId ||
            block.levels?.some(
                level =>
                    level.id === Number(levelId)
            );

        const matchesArea =
            !areaId ||
            block.centralContent?.some(
                cc =>
                    cc.area_id ===
                    Number(areaId)
            );

        const matchesCentralContent =
            !centralContentId ||
            block.centralContent?.some(
                cc =>
                    cc.id === Number(centralContentId)
            );

        return (
            matchesSubject &&
            matchesLevel &&
            matchesArea &&
            matchesCentralContent
        );

    });  

    console.log({
        subjectId,
        levelId,
        areaId,
        centralContentId
    });

    return (
        <>

            <BaseTabLayout

                title="Blockbank"

                actions={

                    <Button
                        onClick={() =>
                            setCreateBlockOpen(
                                true
                            )
                        }
                    >
                        Skapa eget block
                    </Button>

                }

            >

                <BlockFilter

                    subjectId={subjectId}
                    onSubjectChange={setSubjectId}

                    levelId={levelId}
                    onLevelChange={setLevelId}

                    areaId={areaId}
                    onAreaChange={setAreaId}

                    centralContentId={centralContentId}
                    onCentralContentChange={
                        setCentralContentId
                    }

                />


                <BlockLibrary
                    blocks={filteredBlocks}
                    openTab={openTab}
                    onDelete={setBlockToDelete}
                    onReload={loadBlocks}
                />

                <DeleteBlockDialog
                    open={blockToDelete !== null}
                    onOpenChange={(open) => {

                        if (!open) {
                            setBlockToDelete(null);
                        }

                    }}
                    onDelete={deleteBlock}
                />

            </BaseTabLayout>

            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={
                    setCreateBlockOpen
                }
                onCreated={loadBlocks}
            />      

        </>
    );
}