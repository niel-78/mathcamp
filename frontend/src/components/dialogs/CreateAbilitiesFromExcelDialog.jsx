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
    seriesId,
    onCreated
}) {

    const [file, setFile] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [replaceExisting, setReplaceExisting] = useState(false);

    const importAbilities = async () => {

        if (!file || !seriesId) {
            return;
        }

        try {

            setLoading(true);

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "seriesId",
                seriesId
            );

            formData.append(
                "replaceExisting",
                replaceExisting
            );

            console.log(
                "Importing abilities",
                {
                    seriesId
                }
            );

            const response =
                await fetch(
                    `${API_URL}/api/abilities/import`,
                    {
                        method: "POST",
                        headers: authHeaders(),
                        body: formData
                    }
                );

            if (!response.ok) {

                console.error(
                    await response.text()
                );

                return;

            }

            onCreated?.();

            onOpenChange(false);

            setFile(null);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

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

                <div className="flex items-center gap-2">

                    <input
                        id="replace-existing"
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={e =>
                            setReplaceExisting(
                                e.target.checked
                            )
                        }
                    />

                    <label htmlFor="replace-existing">
                        Ersätt befintliga förmågor
                    </label>

                </div>

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
                        !file ||
                        !seriesId ||
                        loading
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