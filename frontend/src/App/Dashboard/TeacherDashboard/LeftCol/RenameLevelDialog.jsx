import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function RenameLevelDialog({
    open,
    onOpenChange,
    level,
    onRenamed
}) {

    const [name, setName] = useState("");

    useEffect(() => {
        setName(level?.name ?? "");
    }, [level]);

    const renameLevel = async () => {
        const response = await fetch(
            `${API_URL}/api/levels/${level.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({ name })
            }
        );

        if (!response.ok) {
            return;
        }

        onOpenChange(false);
        onRenamed?.();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Byt namn på kurs
                    </DialogTitle>
                </DialogHeader>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            renameLevel();
                        }
                    }}
                    className="w-full border rounded p-2"
                />

                <Button onClick={renameLevel}>
                    Spara
                </Button>
            </DialogContent>
        </Dialog>
    );
}