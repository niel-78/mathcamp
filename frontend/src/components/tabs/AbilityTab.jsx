import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BlockLibrary from "@/components/ui/BlockLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DropZone from "@/components/ui/DropZone";
import { Button } from "@/components/ui/button";
import CreateBlockFromExcelDialog from "@/components/ui/CreateBlockFromExcelDialog";

export default function AbilityTab({
    abilityId,
    openTab,
    blockRefreshKey
}) {

    const [ability, setAbility] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {

        loadAbility();
        loadBlocks();

    }, [
        abilityId,
        blockRefreshKey
    ]);

    const loadAbility = async () => {

        const response = await fetch(
            `${API_URL}/api/abilities/${abilityId}`,
            {
                headers: authHeaders()
            }
        );

        const data =
            await response.json();

        setAbility(data);

    };

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/abilities/${abilityId}`,
            {
                headers: authHeaders()
            }
        );

        const data =
            await response.json();

        setBlocks(data);

    };

    const removeBlock = async (
        blockId
    ) => {

        await fetch(
            `${API_URL}/api/blocks/${blockId}/abilities/${abilityId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        loadBlocks();

    };

    if (!ability) {

        return (
            <div className="p-6">
                Laddar...
            </div>
        );

    }

    return (
        <>
            <BaseTabLayout

                title={ability.name}

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
                    id={`ability-${abilityId}`}
                    text="
                        Dra block hit för att
                        koppla dem till denna
                        förmåga
                    "
                />

                <BlockLibrary
                    blocks={blocks}
                    dragPrefix="ability"
                    openTab={openTab}
                    onReload={loadBlocks}
                    onDelete={removeBlock}
                />

            </BaseTabLayout>

            <CreateBlockFromExcelDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                abilityId={abilityId}
                onCreated={(block) => {

                    loadBlocks();

                    openTab({
                        id: `block-${block.id}`,
                        title: `Block #${block.id}`,
                        type: "block",
                        block
                    });

                }}
            />
        </>

    );

}