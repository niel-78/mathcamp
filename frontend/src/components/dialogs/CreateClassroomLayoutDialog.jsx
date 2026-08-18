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

import { Label } from "@/components/ui/label";

export default function CreateClassroomLayoutDialog({
    open,
    onOpenChange,
    classroomId,
    onCreated
}) {

    const [name, setName] =
        useState("");

    const createLayout =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/classrooms/${classroomId}/layouts`,
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

            setName("");

            onCreated?.();

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

                        Ny möblering

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
                                setName(
                                    e.target.value
                                )
                            }
                            placeholder="
                                Provmöblering
                            "
                        />

                    </div>

                    <Button
                        onClick={
                            createLayout
                        }
                        disabled={!name}
                    >
                        Skapa möblering
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}