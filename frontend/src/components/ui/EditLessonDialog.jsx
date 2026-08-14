import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function EditLessonDialog({
    lesson,
    open,
    onOpenChange,
    onSaved
}) {

    const [date, setDate] =
        useState("");

    const [startTime, setStartTime] =
        useState("");

    const [endTime, setEndTime] =
        useState("");

    useEffect(() => {

        if (!lesson) {
            return;
        }

        setDate(
            lesson.starts_at.substring(
                0,
                10
            )
        );

        setStartTime(
            lesson.starts_at.substring(
                11,
                16
            )
        );

        setEndTime(
            lesson.ends_at.substring(
                11,
                16
            )
        );

    }, [lesson]);

    const save = async () => {

        const response =
            await fetch(
                `${API_URL}/api/lessons/${lesson.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        date,
                        start_time: startTime,
                        end_time: endTime
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        onOpenChange(false);

        onSaved?.();

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
                        Redigera lektion
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div>

                        <label>
                            Datum
                        </label>

                        <input
                            type="date"
                            value={date}
                            onChange={(e) =>
                                setDate(
                                    e.target.value
                                )
                            }
                        />

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
                        />

                    </div>

                    <Button
                        onClick={save}
                    >
                        Spara
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}