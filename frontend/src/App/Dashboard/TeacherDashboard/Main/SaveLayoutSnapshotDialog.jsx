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

export default function SaveLayoutSnapshotDialog({
    open,
    onOpenChange,
    groupId,
    layoutId,
    onCompleted
}) {

    const [name, setName] =
        useState("");

    const save = async () => {

        const response =
            await fetch(
                `${API_URL}/api/groups/${groupId}/layout-snapshots`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        layoutId
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        setName("");

        onOpenChange(false);

        onCompleted?.();

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Spara placering
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-3">

                    <input
                        className="
                            w-full
                            border
                            rounded
                            p-2
                        "
                        placeholder="Namn"
                        value={name}
                        onChange={(e) =>
                            setName(
                                e.target.value
                            )
                        }
                    />

                    <Button
                        className="
                            w-full
                        "
                        onClick={save}
                    >
                        Spara
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}