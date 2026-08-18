import { useEffect, useState }
    from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button }
    from "@/components/ui/button";

import { Input }
    from "@/components/ui/input";

import { API_URL }
    from "@/config";

import { authHeaders }
    from "@/api/authHeaders";

export default function RenameSeatDialog({
    seat,
    open,
    onOpenChange,
    onRenamed
}) {

    const [name, setName] =
        useState("");

    useEffect(() => {

        setName(
            seat?.seat_label || ""
        );

    }, [seat]);

    const renameSeat =
        async () => {

            await fetch(
                `${API_URL}/api/classroom-seats/${seat.id}`,
                {
                    method: "PUT",

                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        seat_label: name
                    })
                }
            );

            onRenamed?.();

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
                        Byt namn
                    </DialogTitle>

                </DialogHeader>

                <Input
                    value={name}
                    onChange={(e) =>
                        setName(
                            e.target.value
                        )
                    }
                />

                <Button
                    onClick={
                        renameSeat
                    }
                >
                    Spara
                </Button>

            </DialogContent>

        </Dialog>

    );

}