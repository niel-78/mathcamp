import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function CreateScheduleExceptionDialog({
    open,
    onOpenChange,
    school,
    onCreated
}) {

    const [date, setDate] =
        useState("");

    const [type, setType] =
        useState("study_day");

    const [note, setNote] =
        useState("");

    const [scope, setScope] =
        useState("school");

    const [groups, setGroups] =
        useState([]);

    const [selectedGroups, setSelectedGroups] =
        useState([]);

    useEffect(() => {

        if (!open || !school) {
            return;
        }

        fetch(
            `${API_URL}/api/schools/${school.schoolId}/groups`,
            {
                headers: authHeaders()
            }
        )
            .then(res => res.json())
            .then(data => {
                setGroups(data || []);
            });

    }, [open, school]);

    const toggleGroup = (
        groupId,
        checked
    ) => {

        if (checked) {

            setSelectedGroups(
                previous => [
                    ...previous,
                    groupId
                ]
            );

            return;
        }

        setSelectedGroups(
            previous =>
                previous.filter(
                    id => id !== groupId
                )
        );

    };

    const save = async () => {

        const response =
            await fetch(
                `${API_URL}/api/group-schedules/exceptions`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        school_id:
                            school.schoolId,
                        date,
                        type,
                        note,
                        scope,
                        groupIds:
                            selectedGroups
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        onCreated?.();

        setDate("");
        setType("study_day");
        setNote("");
        setScope("school");
        setSelectedGroups([]);

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
                        Lägg till schemabrytande dag
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div>

                        <label>
                            Datum
                        </label>

                        <Input
                            type="date"
                            value={date}
                            onChange={event =>
                                setDate(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Typ
                        </label>

                        <Select
                            value={type}
                            onValueChange={setType}
                        >

                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>

                                <SelectItem
                                    value="holiday"
                                >
                                    Lovdag
                                </SelectItem>

                                <SelectItem
                                    value="study_day"
                                >
                                    Studiedag
                                </SelectItem>

                                <SelectItem
                                    value="cancelled"
                                >
                                    Inställd undervisning
                                </SelectItem>

                                <SelectItem
                                    value="other"
                                >
                                    Övrigt
                                </SelectItem>

                            </SelectContent>

                        </Select>

                    </div>

                    <div>

                        <label>
                            Anteckning
                        </label>

                        <Input
                            value={note}
                            onChange={event =>
                                setNote(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Gäller för
                        </label>

                        <div className="mt-2 space-y-2">

                            <label
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <input
                                    type="radio"
                                    checked={
                                        scope ===
                                        "school"
                                    }
                                    onChange={() =>
                                        setScope(
                                            "school"
                                        )
                                    }
                                />

                                Hela skolan

                            </label>

                            <label
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <input
                                    type="radio"
                                    checked={
                                        scope ===
                                        "groups"
                                    }
                                    onChange={() =>
                                        setScope(
                                            "groups"
                                        )
                                    }
                                />

                                Endast vissa grupper

                            </label>

                        </div>

                    </div>

                    {
                        scope === "groups" && (

                            <div
                                className="
                                    border
                                    rounded
                                    p-3
                                    max-h-60
                                    overflow-auto
                                    space-y-2
                                "
                            >

                                {
                                    groups.map(
                                        group => (

                                            <label
                                                key={
                                                    group.id
                                                }
                                                className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                "
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selectedGroups.includes(
                                                            group.id
                                                        )
                                                    }
                                                    onChange={e =>
                                                        toggleGroup(
                                                            group.id,
                                                            e.target.checked
                                                        )
                                                    }
                                                />

                                                {
                                                    group.name
                                                }

                                            </label>

                                        )
                                    )
                                }

                            </div>

                        )
                    }

                    <div className="flex justify-end">

                        <Button
                            onClick={save}
                        >
                            Spara
                        </Button>

                    </div>

                </div>

            </DialogContent>

        </Dialog>

    );

}