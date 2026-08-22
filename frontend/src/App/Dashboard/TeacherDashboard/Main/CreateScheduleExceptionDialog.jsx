import { useState } from "react";
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
                        school_id: school.schoolId,
                        date,
                        type,
                        note
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