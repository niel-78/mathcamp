import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function CreateLevelDialog({
    open,
    onOpenChange,
    subject,
    onCreated
}) {

    const [code, setCode] =
        useState("");

    const [name, setName] =
        useState("");

    const handleCreate =
        async () => {

        const response =
            await fetch(
                `${API_URL}/api/levels`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        subjectId:
                            subject.subjectId,
                        code,
                        name
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        onCreated?.();

        onOpenChange(false);

        setCode("");
        setName("");

    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>

                <DialogHeader>
                    <DialogTitle>
                        Ny kurs
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    <div>
                        Ämne:
                        {" "}
                        {subject?.subjectName}
                    </div>

                    <Input
                        placeholder="Kod"
                        value={code}
                        onChange={e =>
                            setCode(
                                e.target.value
                            )
                        }
                    />

                    <Input
                        placeholder="Namn"
                        value={name}
                        onChange={e =>
                            setName(
                                e.target.value
                            )
                        }
                    />

                    <Button
                        onClick={handleCreate}
                    >
                        Skapa kurs
                    </Button>

                </div>

            </DialogContent>
        </Dialog>
    );

}