import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function RenameGroupDialog({
    group,
    open,
    onOpenChange,
    onRenamed
}) {

    const [name, setName] = useState("");

    useEffect(() => {

        setName(group?.name ?? "");

    }, [group]);

    const save = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${group.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:authHeaders()
                },
                body: JSON.stringify({
                    name
                })
            }
        );

        if (response.ok) {

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
                        Byt namn på grupp
                    </DialogTitle>

                </DialogHeader>

                <input
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {
                            save();
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
                    onClick={save}
                    className="
                        bg-blue-600
                        text-white
                        rounded
                        px-4
                        py-2
                    "
                >
                    Spara
                </Button>

            </DialogContent>

        </Dialog>

    );

}