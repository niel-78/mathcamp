import { useEffect, useState } from "react";
import { API_URL } from "@/config";

import BlockLibrary from "@/components/ui/BlockLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";

export default function CentralContentTab({
    centralContentId,
    centralContentTitle,
    levelCode,
    blockRefreshKey,
    openTab
}) {

    const [blocks, setBlocks] = useState([]);

    useEffect(() => {

        console.log(
            "CentralContentTab loadBlocks",
            blockRefreshKey
        );

        loadBlocks();

    }, [
        centralContentId,
        blockRefreshKey
    ]);

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    const loadBlocks = async () => {

        console.log(
            "loadBlocks",
            centralContentId
            );

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

                title={`${levelCode} - ${centralContentTitle}`}

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

                <BlockLibrary
                    blocks={blocks}
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

        </>    

    );

}