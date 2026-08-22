import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function ImportScheduleExceptionsDialog({
    open,
    onOpenChange,
    school,
    onImported
}) {

    const [file, setFile] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const importFile = async () => {

        if (!file) {
            return;
        }

        setLoading(true);

        try {

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "schoolId",
                school.schoolId
            );

            const response =
                await fetch(
                    `${API_URL}/api/group-schedules/exceptions/import`,
                    {
                        method: "POST",
                        headers: authHeaders(),
                        body: formData
                    }
                );

            if (!response.ok) {
                return;
            }

            onImported?.();

            setFile(null);

            onOpenChange(false);

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
                        Importera schemabrytande dagar
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    <div>
                        Excel-fil med kolumner:
                        <br />
                        Datum, Typ, Anteckning
                    </div>

                    <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={event =>
                            setFile(
                                event.target.files?.[0]
                            )
                        }
                    />

                    <div className="flex justify-end">

                        <Button
                            onClick={importFile}
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

                </div>

            </DialogContent>
        </Dialog>
    );
}