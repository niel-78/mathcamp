import { useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function CreateBlockFromExcelDialog({
    open,
    onOpenChange,
    abilityId,
    sectionId,
    centralContentId,
    onCreated
}) {

    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const createBlock = async () => {

        setLoading(true);

        const formData = new FormData();

        formData.append("file", file);

        if (abilityId) {
            formData.append(
                "abilityId",
                abilityId
            );
        }

        if (sectionId) {
            formData.append(
                "sectionId",
                sectionId
            );
        }

        if (centralContentId) {
            formData.append(
                "centralContentId",
                centralContentId
            );
        }

        const response = await fetch(
            `${API_URL}/api/blocks/import`,
            {
                method: "POST",
                headers: authHeaders(),
                body: formData
            }
        );

        const data = await response.json();

        onCreated?.(data.block);

        onOpenChange(false);

    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>

                <DialogHeader>
                    <DialogTitle>
                        Skapa block från Excel
                    </DialogTitle>
                </DialogHeader>

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                        setFile(
                            e.target.files?.[0]
                        )
                    }
                />

                <Button
                    onClick={createBlock}
                    disabled={!file}
                >
                    Skapa block
                </Button>

                {result && (

                    <div
                        className="
                            rounded-md
                            border
                            border-green-500
                            bg-green-500/10
                            p-3
                        "
                    >
                        Block #{result.blockId} skapades

                        <br />

                        {result.questionCount} frågor importerades
                    </div>

                )}

            </DialogContent>
        </Dialog>
    );

}