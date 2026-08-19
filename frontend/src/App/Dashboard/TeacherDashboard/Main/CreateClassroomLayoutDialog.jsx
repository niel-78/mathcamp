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

export default function CreateClassroomLayoutDialog({
    open,
    onOpenChange,
    classroomId,
    onCreated
}) {

    const [layouts, setLayouts] =
        useState([]);

    const [name, setName] =
        useState("");

    const [sourceLayoutId,
        setSourceLayoutId] =
        useState("");

    useEffect(() => {

        if (!open) {
            return;
        }

        loadLayouts();

    }, [open]);

    const loadLayouts = async () => {

        const response =
            await fetch(
                `${API_URL}/api/classroom-layouts/templates`,
                {
                    headers: authHeaders()
                }
            )

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        console.log(data);

        setLayouts(data);

    };

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
                            name,
                            source_layout_id:
                                sourceLayoutId || null
                        })
                    }
                );

            if (!response.ok) {
                return;
            }

            setName("");
            setSourceLayoutId("");

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

                    <div className="space-y-2">

                        <Label>
                            Kopiera från
                        </Label>

                        <select
                            className="
                                w-full
                                border
                                rounded
                                p-2
                            "
                            value={sourceLayoutId}
                            onChange={(e) =>
                                setSourceLayoutId(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Tom möblering
                            </option>

                            {layouts.map(layout => (

                                <option
                                    key={layout.id}
                                    value={layout.id}
                                >
                                    {layout.classroom_name} - {layout.name}
                                </option>

                            ))}

                        </select>

                    </div>

                    <Button
                        onClick={createLayout}
                        disabled={!name.trim()}
                    >
                        Skapa möblering
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}