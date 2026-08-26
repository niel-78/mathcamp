import { useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function ImportCriteriaDialog({
    open,
    onOpenChange,
    level,
    onImported
}) {

    const [replaceExisting, setReplaceExisting] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImport = async () => {

        try {

            if (!file) {
                return;
            }

            const formData = new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "replaceExisting",
                replaceExisting
            );

            const response = await fetch(
                `${API_URL}/api/levels/${level.levelId}/import-central-content`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Importen misslyckades"
                );
            }

            toast.success(
                `Importerade ${data.importedCount} rader`
            );

            if (data.skippedCount > 0) {
                toast.info(
                    `${data.skippedCount} rader hoppades över`
                );
            }

            onImported?.();

            onOpenChange(false);
        
        }
        catch (error) {

            console.error(error);

            toast.error(
                error.message ||
                "Importen misslyckades"
            );

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
                        Importera centralt innehåll
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div className="space-y-2">

                        <label className="flex gap-2">
                            <input
                                type="radio"
                                name="import-mode"
                                checked={!replaceExisting}
                                onChange={() =>
                                    setReplaceExisting(false)
                                }
                            />
                            Lägg till
                        </label>

                        <label className="flex gap-2">
                            <input
                                type="radio"
                                name="import-mode"
                                checked={replaceExisting}
                                onChange={() =>
                                    setReplaceExisting(true)
                                }
                            />
                            Ersätt befintligt innehåll
                        </label>

                    </div>

                    <div>
                        Kurs:
                        {" "}
                        <strong>
                            {level?.levelName}
                        </strong>
                    </div>

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={e =>
                            setFile(
                                e.target.files?.[0]
                            )
                        }
                    />

                    <Button
                        onClick={handleImport}
                        disabled={
                            !file ||
                            loading
                        }
                    >
                        {
                            loading
                                ? "Importerar..."
                                : "Importera"
                        }
                    </Button>

                </div>

            </DialogContent>
        </Dialog>
    );

}