import { useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DuplicateLayoutDialog({
    layout,
    open,
    onOpenChange,
    onDuplicated
}) {

    const [name, setName] =
        useState("");

    const duplicateLayout =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/classroom-layouts/${layout.id}/duplicate`,
                    {
                        method: "POST",

                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name
                        })
                    }
                );

            if (!response.ok) {
                return;
            }

            onOpenChange(false);

            onDuplicated?.();

        };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Duplicera möblering
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <Input
                        value={name}
                        onChange={(e) =>
                            setName(
                                e.target.value
                            )
                        }
                        placeholder="Namn på kopian"
                    />

                    <Button
                        onClick={
                            duplicateLayout
                        }
                        disabled={!name}
                    >
                        Skapa kopia
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}