import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BaseTabLayout
    from "@/components/layouts/BaseTabLayout";

import CardSection
    from "@/components/layouts/CardSection";

import { Button }
    from "@/components/ui/button";

import DeleteBlockDialog
    from "@/components/ui/DeleteBlockDialog";

export default function ArchivedBlocksTab() {

    const [blocks, setBlocks] = useState([]);

    const [loading, setLoading] = useState(true);

    const [blockToDelete, setBlockToDelete] = useState(null);

    useEffect(() => {

        loadBlocks();

    }, []);

    const loadBlocks = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/blocks`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setBlocks(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const restoreBlock = async (
        blockId
    ) => {

        try {

            await fetch(
                `${API_URL}/api/archive/blocks/${blockId}/restore`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            window.dispatchEvent(
                new Event("blocks-changed")
            );

            await loadBlocks();

        } catch (error) {

            console.error(error);

        }

    };

    const deleteBlock = async () => {

        if (!blockToDelete) {
            return;
        }

        try {

            await fetch(
                `${API_URL}/api/archive/blocks/${blockToDelete.id}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            setBlockToDelete(null);

            await loadBlocks();

        } catch (error) {

            console.error(error);

        }

    };

    return (

        <>
            <BaseTabLayout
                title="Arkiverade block"
            >

                <CardSection
                    title="Arkiverade block"
                    description="Block som du har skapat och arkiverat."
                >

                    {loading && (

                        <div>
                            Laddar...
                        </div>

                    )}

                    {!loading &&
                    blocks.length === 0 && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Inga arkiverade block.
                        </div>

                    )}

                    <div className="space-y-4">

                        {blocks.map(block => (

                            <div
                                key={block.id}
                                className="
                                    border
                                    rounded-lg
                                    p-4

                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                <div>

                                    <div
                                        className="
                                            font-medium
                                        "
                                    >
                                        Block #{block.id}
                                    </div>

                                    <div
                                        className="
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >
                                        Synlighet:
                                        {" "}
                                        {block.visibility}
                                    </div>

                                </div>

                                <div
                                    className="
                                        flex
                                        gap-2
                                    "
                                >

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            restoreBlock(
                                                block.id
                                            )
                                        }
                                    >
                                        Återställ
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setBlockToDelete(
                                                block
                                            )
                                        }
                                    >
                                        Radera
                                    </Button>

                                </div>

                            </div>

                        ))}

                    </div>

                </CardSection>

            </BaseTabLayout>

            <DeleteBlockDialog
                open={!!blockToDelete}
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