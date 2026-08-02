import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import CreateBlock from "@/components/ui/CreateBlock";
import BlockLibrary from "@/components/ui/BlockLibrary";
import DeleteBlockDialog from "@/components/ui/DeleteBlockDialog";

export default function BlockBankTab({
    openTab,
}) {

    const [blocks, setBlocks] = useState([]);
    const [blockToDelete, setBlockToDelete] = useState(null);

    useEffect(() => {
        loadBlocks();
    }, []);

    const loadBlocks = async () => {

        const res = await fetch(
            `${API_URL}/api/teacher/blocks/full`,
            {
                headers: authHeaders()
            }
        );

        const data = await res.json();

        setBlocks(data);

    };

    const deleteBlock = async () => {

        await fetch(
            `${API_URL}/api/teacher/blocks/${blockToDelete}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        setBlockToDelete(null);

        loadBlocks();

    };

    return (
        <>
            <h2 className="text-xl font-bold mb-4">
                Blockbank
            </h2>

            <CreateBlock
                onCreated={loadBlocks}
            />

            <BlockLibrary
                blocks={blocks}
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
        </>
    );
}