import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BlockBrowser
    from "@/components/ui/BlockBrowser";

export default function ImportBlocksDialog({
    open,
    onOpenChange,
    examId,
    onImported
}) {

    const [
        selectedBlocks,
        setSelectedBlocks
    ] = useState([]);

    const importBlocks = async () => {

        if (
            selectedBlocks.length === 0
        ) {
            return;
        }

        await Promise.all(

            selectedBlocks.map(
                blockId =>

                    fetch(
                        `${API_URL}/api/exams/${examId}/import-block`,
                        {
                            method: "POST",
                            headers: {
                                ...authHeaders(),
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                block_id: blockId
                            })
                        }
                    )

            )

        );

        setSelectedBlocks([]);

        onImported?.();

        onOpenChange(false);

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent
                className="
                    max-w-6xl
                    h-[80vh]
                "
            >

                <DialogHeader>

                    <DialogTitle>
                        Importera block
                    </DialogTitle>

                </DialogHeader>

                <div
                    className="
                        flex-1
                        overflow-hidden
                    "
                >

                    <BlockBrowser
                        selectable
                        selectedBlocks={
                            selectedBlocks
                        }
                        onSelectionChange={
                            setSelectedBlocks
                        }
                    />

                </div>

                <div
                    className="
                        flex
                        justify-end
                        gap-2
                    "
                >

                    <Button
                        variant="outline"
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Avbryt
                    </Button>

                    <Button
                        disabled={
                            selectedBlocks.length === 0
                        }
                        onClick={importBlocks}
                    >
                        Importera
                        {" "}
                        (
                        {selectedBlocks.length}
                        )
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}