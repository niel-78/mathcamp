import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { API_URL } from "@/config";

import { authHeaders } from "@/api/authHeaders";

import { toast } from "sonner";

export default function CreateBookDialog({
    open,
    onOpenChange,
    subjects,
    onCreated
}) {

    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [levelId, setLevelId] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const handleSave = async () => {

        try {

            if (
                !title.trim() ||
                !levelId
            ) {

                toast.error(
                    "Titel och kurs krävs"
                );

                return;

            }

            setSaving(true);

            const response =
                await fetch(
                    `${API_URL}/api/books`,
                    {
                        method: "POST",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            title,
                            description,
                            levelId
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Kunde inte skapa bok"
                );

            }

            toast.success(
                "Boken skapades"
            );

            setTitle("");
            setDescription("");
            setLevelId("");

            onCreated?.();

            onOpenChange(false);

        } catch (error) {

            console.error(error);

            toast.error(
                error.message
            );

        } finally {

            setSaving(false);

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
                        Ny bok
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <Input
                        placeholder="Titel"
                        value={title}
                        onChange={e =>
                            setTitle(
                                e.target.value
                            )
                        }
                    />

                    <Textarea
                        placeholder="Beskrivning"
                        value={description}
                        onChange={e =>
                            setDescription(
                                e.target.value
                            )
                        }
                    />

                    <Select
                        value={levelId}
                        onValueChange={setLevelId}
                    >

                        <SelectTrigger className="w-full min-w-[300px]">

                            <SelectValue
                                placeholder="Välj kurs"
                            />

                        </SelectTrigger>

                        <SelectContent>

                            {subjects.map(
                                subject => (

                                subject.levels.map(
                                    level => (

                                    <SelectItem
                                        key={level.id}
                                        value={String(level.id)}
                                    >
                                        {subject.name}
                                        {" - "}
                                        {level.name}
                                    </SelectItem>

                                ))
                            ))}

                        </SelectContent>

                    </Select>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                    >

                        {
                            saving
                                ? "Sparar..."
                                : "Skapa bok"
                        }

                    </Button>

                </div>

            </DialogContent>

        </Dialog>
    );

}