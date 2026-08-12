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
    subjectId
}) {

    const [name, setName] = useState("");

    const createAbility = async () => {

        const res = await fetch(
            `${API_URL}/api/abilities`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    name,
                    subjectId
                })
            }
        );

        if (res.ok) {

            setName("");

            onOpenChange(false);

            onCreated?.();

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
                    className="
                        mt-4
                    "
                >
                    Skapa förmåga
                </Button>

            </DialogContent>

        </Dialog>

    );

}