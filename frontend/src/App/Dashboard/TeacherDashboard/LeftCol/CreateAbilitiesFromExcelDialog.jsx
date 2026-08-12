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

export default function CreateAbilitiesFromExcelDialog({
    open,
    onOpenChange,
    subjectId,
    onCreated
}) {

    const [file, setFile] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const importAbilities = async () => {

        setLoading(true);

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        formData.append(
            "subjectId",
            subjectId
        );

        const response = await fetch(
            `${API_URL}/api/abilities/import`,
            {
                method: "POST",
                headers: authHeaders(),
                body: formData
            }
        );

        if (response.ok) {

            onCreated?.();

            onOpenChange(false);

        }

        setLoading(false);

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Lägg till förmågor via Excel
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
                    onClick={importAbilities}
                    disabled={
                        !file || loading
                    }
                >
                    {
                        loading
                            ? "Importerar..."
                            : "Importera"
                    }
                </Button>

            </DialogContent>

        </Dialog>

    );

}