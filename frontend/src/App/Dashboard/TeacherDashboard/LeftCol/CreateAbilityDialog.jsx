import { useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function CreateAbilityDialog({
    open,
    onOpenChange,
    onCreated,
    series
}) {

    const [name, setName] = useState("");

    const createAbility = async () => {

        try {

            console.log("createAbility");

            const payload = {
                name,
                seriesId: series.id
            };

            console.log("payload", payload);

            console.log("before fetch");

            const res = await fetch(
                `${API_URL}/api/abilities`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify(payload)
                }
            );

            console.log("after fetch");
            console.log("status", res.status);

        } catch (error) {

            console.error("FETCH ERROR", error);

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
                        Ny förmåga
                    </DialogTitle>

                </DialogHeader>

                <div className="text-sm text-muted-foreground">
                    {series?.name}
                </div>

                <input
                    value={name}
                    onChange={(e) =>
                        setName(
                            e.target.value
                        )
                    }
                    placeholder="Förmåga"
                    onKeyDown={(e) => {

                        if (
                            e.key === "Enter"
                        ) {

                            createAbility();

                        }

                    }}
                    className="
                        w-full
                        border
                        rounded
                        p-2
                    "
                />

                <Button
                    onClick={createAbility}
                    className="mt-4"
                >
                    Skapa förmåga
                </Button>

            </DialogContent>

        </Dialog>

    );

}