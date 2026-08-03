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

export default function CreateGroupDialog({
    open,
    onOpenChange,
    onCreated
}) {

    const [name, setName] = useState("");

    const createGroup = async () => {

        const res = await fetch(
            `${API_URL}/api/groups`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    name
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
                        Ny grupp
                    </DialogTitle>
                </DialogHeader>

                <input
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    placeholder="Gruppnamn"
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {
                            createGroup();
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
                    onClick={createGroup}
                    className="
                        mt-4
                        bg-blue-600
                        text-white
                        px-4
                        py-2
                        rounded
                    "
                >
                    Skapa grupp
                </Button>

            </DialogContent>

        </Dialog>

    );
}