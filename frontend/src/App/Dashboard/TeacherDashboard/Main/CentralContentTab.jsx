import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import BlockLibrary from "@/components/ui/BlockLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import DropZone from "@/components/ui/DropZone";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";
import CreateBlockFromExcelDialog from "@/components/ui/CreateBlockFromExcelDialog";

export default function CentralContentTab({
    centralContentId,
    centralContentTitle,
    levelCode,
    blockRefreshKey,
    openTab
}) {

    const [blocks, setBlocks] = useState([]);
    const [createBlockOpen, setCreateBlockOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {

        loadBlocks();

    }, [
        centralContentId,
        blockRefreshKey
    ]);

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/central-content/${centralContentId}`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            const text = await response.text();

            console.error(text);

            return;

        }

        const data = await response.json();

        setBlocks(data);

    };

    const removeBlock = async (blockId) => {

        await fetch(
            `${API_URL}/api/blocks/${blockId}/central-content/${centralContentId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        loadBlocks();

    };

    return (
        
        <>
            <BaseTabLayout

                title={centralContentTitle}

                actions={
                    <Button
                        variant="outline"
                        onClick={() =>
                            setImportOpen(true)
                        }
                    >
                        Skapa block från Excel
                    </Button>
                }

            >

                <DropZone
                    id={`cc-${centralContentId}`}
                    text="
                        Dra block hit för att koppla dem
                        till detta centrala innehåll
                    "
                />

                <BlockLibrary
                    blocks={blocks}
                    dragPrefix="cc"
                    openTab={openTab}
                    onReload={loadBlocks}
                    onDelete={removeBlock}
                />

            </BaseTabLayout>

            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={
                    setCreateBlockOpen
                }
                centralContentIds={[
                    centralContentId
                ]}
                onCreated={loadBlocks}
            />

            <CreateBlockFromExcelDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                centralContentId={centralContentId}
                onCreated={(block) => {

                    loadBlocks();

                    openTab({
                        id: `block-${block.id}`,
                        title: `Block #${block.id}`,
                        type: "block",
                        block
                    });

                    setImportOpen(false);

                }}
            />

        </>    

    );

}