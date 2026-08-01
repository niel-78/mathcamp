import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BlockLibrary from "@/components/ui/BlockLibrary";
import CreateBlock from "@/components/ui/CreateBlock";

export default function CentralContentTab({
    centralContentId,
    centralContentTitle,
    levelCode,
    openTab
}) {

    const [blocks, setBlocks] = useState([]);

    useEffect(() => {

        loadBlocks();

    }, [centralContentId]);

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/central-content/${centralContentId}/blocks`,
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
                centralContentIds={[centralContentId]}
                onCreated={loadBlocks}
            />

            <BlockLibrary
                blocks={blocks}
                openTab={openTab}
            />

        </div>

    );

}