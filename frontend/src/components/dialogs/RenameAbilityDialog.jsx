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

export default function RenameAbilityDialog({
    open,
    onOpenChange,
    ability,
    onRenamed
}) {

    const [name, setName] =
        useState("");

    useEffect(() => {

        setName(
            ability?.name ?? ""
        );

    }, [ability]);

    const renameAbility = async () => {

        const res = await fetch(
            `${API_URL}/api/abilities/${ability.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    name
                })
            }
        );

        if (res.ok) {

            onOpenChange(false);

            onRenamed?.();

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
                        Byt namn på förmåga
                    </DialogTitle>

                </DialogHeader>

                <input
                    value={name}
                    onChange={(e) =>
                        setName(
                            e.target.value
                        )
                    }
                    className="
                        w-full
                        border
                        rounded
                        p-2
                    "
                    onKeyDown={(e) => {

                        if (
                            e.key === "Enter"
                        ) {

                            renameAbility();

                        }

                    }}
                />

                <Button
                    onClick={
                        renameAbility
                    }
                >
                    Spara
                </Button>

            </DialogContent>

        </Dialog>

    );

}