import { useEffect, useState } from "react";

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
import { Label } from "@/components/ui/label";

export default function RenameLayoutDialog({
    layout,
    open,
    onOpenChange,
    onRenamed
}) {

    const [name, setName] = useState("");

    useEffect(() => {

        setName(layout?.name || "");

    }, [layout]);

    const renameLayout = async () => {

        const response = await fetch(
            `${API_URL}/api/classroom-layouts/${layout.id}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
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
                        Byt namn på möblering
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div className="space-y-2">

                        <Label>
                            Namn
                        </Label>

                        <Input
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            onKeyDown={(e) => {

                                if (
                                    e.key === "Enter" &&
                                    name
                                ) {

                                    renameLayout();

                                }

                            }}
                        />

                    </div>

                    <Button
                        onClick={renameLayout}
                        disabled={!name}
                    >
                        Spara
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}