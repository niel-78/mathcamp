import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateAbilitySeriesDialog({
    open,
    onOpenChange,
    onCreated,
    subjects
}) {

    const { user } = useAuth();

    const [name, setName] =
        useState("");

    const [subjectId, setSubjectId] =
        useState("");

    const [visibility, setVisibility] =
        useState("private");

    const [saving, setSaving] =
        useState(false);

    const handleSave = async () => {

        if (!name.trim() || !subjectId) {
            return;
        }

        try {

            setSaving(true);

            const response =
                await fetch(
                    `${API_URL}/api/ability-series`,
                    {
                        method: "POST",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            name,
                            subjectId,
                            visibility,
                            userId: user.id
                        })
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Kunde inte skapa serien"
                );
            }

            setName("");
            setSubjectId("");
            setVisibility("private");

            onCreated?.();

            onOpenChange(false);

        } catch (error) {

            console.error(error);

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
                        Ny serie
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <Input
                        placeholder="Namn"
                        value={name}
                        onChange={e =>
                            setName(
                                e.target.value
                            )
                        }
                    />

                    <Select
                        value={subjectId}
                        onValueChange={setSubjectId}
                    >

                        <SelectTrigger className="w-full min-w-[300px]">

                            <SelectValue
                                placeholder="Välj ämne"
                            />

                        </SelectTrigger>

                        <SelectContent>

                            {subjects.map(subject => (

                                <SelectItem
                                    key={subject.id}
                                    value={String(subject.id)}
                                >
                                    {subject.name}
                                </SelectItem>

                            ))}

                        </SelectContent>

                    </Select>

                    <Select
                        value={visibility}
                        onValueChange={setVisibility}
                    >

                        <SelectTrigger className="w-full min-w-[300px]">

                            <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                            <SelectItem value="private">
                                Privat
                            </SelectItem>

                            <SelectItem value="school">
                                Skola
                            </SelectItem>

                            <SelectItem value="global">
                                Global
                            </SelectItem>

                        </SelectContent>

                    </Select>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {
                            saving
                                ? "Sparar..."
                                : "Skapa serie"
                        }
                    </Button>

                </div>

            </DialogContent>

        </Dialog>
    );

}