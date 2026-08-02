import { useEffect, useState } from "react";
import { API_URL } from "@/config";

import BlockLibrary from "@/components/ui/BlockLibrary";
import CreateBlock from "@/components/ui/CreateBlock";
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

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/central-content/${centralContentId}/blocks`,
            {
                headers: authHeaders()
            }
        );

        console.log(response.url);
        console.log(response.status);

        if (!response.ok) {

            const text = await response.text();

            console.error(text);

            return;

        }

        const data = await response.json();

        console.log(data);

        setBlocks(data);

    };

    console.log("blocks state", blocks);

    return (
        <div>

            <div className="mb-6">

                <h1 className="text-2xl font-bold">
                    {levelCode}
                </h1>

                <p className="text-muted-foreground mt-2">
                    {centralContentTitle}
                </p>

            </div>

            <CreateBlock
                centralContentId={centralContentId}
                onCreated={loadBlocks}
            />

            <BlockLibrary
                blocks={blocks}
                openTab={openTab}
                onReload={loadBlocks}
            />

        </div>
    );

}