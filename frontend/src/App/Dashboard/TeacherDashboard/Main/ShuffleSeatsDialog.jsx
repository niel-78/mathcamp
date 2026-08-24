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

export default function ShuffleSeatsDialog({
    open,
    onOpenChange,
    groupId,
    onCompleted
}) {

    const [mode, setMode] =
        useState("current-seats");

    const shuffle =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/groups/${groupId}/seat-assignments/shuffle`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...authHeaders()
                        },
                        body: JSON.stringify({
                            mode
                        })
                    }
                );

            if (!response.ok) {
                return;
            }

            onCompleted?.();

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
                        Slumpa sittplatser
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <p>
                        Alla opinnade elever får nya
                        platser.
                    </p>

                    <label
                        className="
                            flex
                            gap-2
                            items-start
                            cursor-pointer
                        "
                    >

                        <input
                            type="radio"
                            name="shuffle-mode"
                            value="current-seats"
                            checked={
                                mode === "current-seats"
                            }
                            onChange={() =>
                                setMode(
                                    "current-seats"
                                )
                            }
                        />

                        <div>

                            <div>
                                Använd endast
                                nuvarande platser
                            </div>

                            <div
                                className="
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                Eleverna slumpas om
                                mellan de platser som
                                används idag.
                            </div>

                        </div>

                    </label>

                    <label
                        className="
                            flex
                            gap-2
                            items-start
                            cursor-pointer
                        "
                    >

                        <input
                            type="radio"
                            name="shuffle-mode"
                            value="all-seats"
                            checked={
                                mode === "all-seats"
                            }
                            onChange={() =>
                                setMode(
                                    "all-seats"
                                )
                            }
                        />

                        <div>

                            <div>
                                Använd alla platser i
                                klassrummet
                            </div>

                            <div
                                className="
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                Elever kan placeras på
                                platser som idag är tomma.
                            </div>

                        </div>

                    </label>

                    <Button
                        onClick={shuffle}
                    >
                        Slumpa
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}