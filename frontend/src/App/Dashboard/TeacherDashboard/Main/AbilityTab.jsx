import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BlockLibrary from "@/components/ui/BlockLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DropZone from "@/components/ui/DropZone";

export default function AbilityTab({
    abilityId,
    openTab,
    blockRefreshKey
}) {

    const [ability, setAbility] =
        useState(null);

    const [blocks, setBlocks] =
        useState([]);

    useEffect(() => {

        loadAbility();
        loadBlocks();

    }, [
        abilityId,
        blockRefreshKey
    ]);

    const loadAbility = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/abilities/${abilityId}`,
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

        <BaseTabLayout

            title={ability.name}

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

    );

}