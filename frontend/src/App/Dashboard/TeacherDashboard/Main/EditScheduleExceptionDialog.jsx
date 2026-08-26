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

export default function EditScheduleExceptionDialog({
    exception,
    open,
    onOpenChange,
    onSaved
}) {

    const [date, setDate] =
        useState("");

    const [title, setTitle] =
        useState("");

    const [type, setType] =
        useState("");

    const [note, setNote] =
        useState("");

    const [
        affectsLessons,
        setAffectsLessons
    ] = useState(true);

    const [scope, setScope] =
        useState("school");

    const [groups, setGroups] =
        useState([]);

    const [
        selectedGroups,
        setSelectedGroups
    ] = useState([]);

    useEffect(() => {

        if (
            !open ||
            !exception?.schoolId
        ) {
            return;
        }

        fetch(
            `${API_URL}/api/schools/${exception.schoolId}/groups`,
            {
                headers:
                    authHeaders()
            }
        )
            .then(res => res.json())
            .then(data => {
                setGroups(data || []);
            });

    }, [open, exception]);

    useEffect(() => {

        setDate(
            exception?.date ?? ""
        );

        setTitle(
            exception?.title ?? ""
        );

        setType(
            exception?.type ?? ""
        );

        setNote(
            exception?.note ?? ""
        );

        setAffectsLessons(
            exception?.affects_lessons ?? true
        );

        if (
            exception?.groups?.length > 0
        ) {

            setScope("groups");

            setSelectedGroups(
                exception.groups.map(
                    group => group.id
                )
            );

        } else {

            setScope("school");

            setSelectedGroups([]);

        }

    }, [exception]);

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
                `${API_URL}/api/group-schedules/exceptions/${exception.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        date,
                        title,
                        type,
                        note,
                        affects_lessons:
                            affectsLessons,
                        scope,
                        groupIds:
                            selectedGroups
                    })
                }
            );

        if (response.ok) {

            onOpenChange(false);

            onSaved?.();

        }

    };

    return (

        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Redigera händelse
                    </DialogTitle>

                </DialogHeader>

                <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                        setDate(
                            e.target.value
                        )
                    }
                    className="
                        w-full
                        border
                        rounded
                        p-2
                    "
                />

                <input
                    value={title}
                    onChange={(e) =>
                        setTitle(
                            e.target.value
                        )
                    }
                    placeholder="Rubrik"
                    className="
                        w-full
                        border
                        rounded
                        p-2
                    "
                />

                <select
                    value={type}
                    onChange={(e) =>
                        setType(
                            e.target.value
                        )
                    }
                    className="
                        w-full
                        border
                        rounded
                        p-2
                    "
                >
                    <option value="study_day">
                        Studiedag
                    </option>

                    <option value="holiday">
                        Lovdag
                    </option>

                    <option value="cancelled">
                        Inställd undervisning
                    </option>

                    <option value="other">
                        Övrigt
                    </option>
                </select>

                <input
                    value={note}
                    onChange={(e) =>
                        setNote(
                            e.target.value
                        )
                    }
                    placeholder="Beskrivning"
                    className="
                        w-full
                        border
                        rounded
                        p-2
                    "
                />

                <label
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >

                    <input
                        type="checkbox"
                        checked={
                            affectsLessons
                        }
                        onChange={(e) =>
                            setAffectsLessons(
                                e.target.checked
                            )
                        }
                    />

                    Påverkar undervisning

                </label>

                <div className="space-y-2">

                    <strong>
                        Gäller för
                    </strong>

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
                                scope === "school"
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
                                scope === "groups"
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

                {scope === "groups" && (

                    <div
                        className="
                            border
                            rounded
                            p-3
                            max-h-48
                            overflow-auto
                        "
                    >

                        {groups.map(
                            group => (

                                <label
                                    key={
                                        group.id
                                    }
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        mb-2
                                    "
                                >

                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedGroups.includes(
                                                group.id
                                            )
                                        }
                                        onChange={(e) =>
                                            toggleGroup(
                                                group.id,
                                                e.target.checked
                                            )
                                        }
                                    />

                                    {group.name}

                                </label>

                            )
                        )}

                    </div>

                )}

                <Button
                    onClick={save}
                >
                    Spara
                </Button>

            </DialogContent>

        </Dialog>

    );

}