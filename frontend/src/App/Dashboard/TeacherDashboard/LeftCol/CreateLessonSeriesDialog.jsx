import { useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function CreateLessonSeriesDialog({
    open,
    onOpenChange,
    group
}) {

    const [weekday, setWeekday] =
        useState(1);

    const [startTime, setStartTime] =
        useState("08:00");

    const [endTime, setEndTime] =
        useState("09:20");

    const [validFrom, setValidFrom] =
        useState("");

    const [validTo, setValidTo] =
        useState("");

    const save = async () => {

        const response = await fetch(
            `${API_URL}/api/group-schedules`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    group_id: group.groupId,
                    weekday,
                    start_time: startTime,
                    end_time: endTime,
                    valid_from: validFrom,
                    valid_to: validTo
                })
            }
        );

        if (!response.ok) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent(
                "group-schedule-created",
                {
                    detail: {
                        groupId: group.groupId
                    }
                }
            )
        );

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
                        Skapa lektioner
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div>

                        <label>
                            Veckodag
                        </label>

                        <select
                            className="w-full border rounded p-2"
                            value={weekday}
                            onChange={(e) =>
                                setWeekday(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                        >

                            <option value={1}>Måndag</option>
                            <option value={2}>Tisdag</option>
                            <option value={3}>Onsdag</option>
                            <option value={4}>Torsdag</option>
                            <option value={5}>Fredag</option>
                            <option value={6}>Lördag</option>
                            <option value={7}>Söndag</option>

                        </select>

                    </div>

                    <div>

                        <label>
                            Starttid
                        </label>

                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) =>
                                setStartTime(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded p-2"
                        />

                    </div>

                    <div>

                        <label>
                            Sluttid
                        </label>

                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) =>
                                setEndTime(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded p-2"
                        />

                    </div>

                    <div>

                        <label>
                            Från datum
                        </label>

                        <input
                            type="date"
                            value={validFrom}
                            onChange={(e) =>
                                setValidFrom(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded p-2"
                        />

                    </div>

                    <div>

                        <label>
                            Till datum
                        </label>

                        <input
                            type="date"
                            value={validTo}
                            onChange={(e) =>
                                setValidTo(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded p-2"
                        />

                    </div>

                    <Button
                        className="w-full"
                        onClick={save}
                    >
                        Skapa
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}