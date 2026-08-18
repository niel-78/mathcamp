import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button }
    from "@/components/ui/button";

export default function EditGroupScheduleDialog({
    schedule,
    open,
    onOpenChange,
    onSaved
}) {

    const [startTime,
        setStartTime] =
        useState("");

    const [endTime,
        setEndTime] =
        useState("");

    const [scope, setScope] =
        useState("all");
    
    const [effectiveFrom, setEffectiveFrom] = useState("");

    const [classrooms, setClassrooms] =
        useState([]);

    const [layouts, setLayouts] =
        useState([]);

    const [classroomId, setClassroomId] =
        useState("");

    const [layoutId, setLayoutId] =
        useState("");


    useEffect(() => {

        if (!schedule) {
            return;
        }

        setStartTime(
            schedule.start_time
        );

        setEndTime(
            schedule.end_time
        );

    }, [schedule]);

    useEffect(() => {

        if (!schedule) {
            return;
        }

        setStartTime(
            schedule.start_time
        );

        setEndTime(
            schedule.end_time
        );

        setScope("all");

    }, [schedule]);

    useEffect(() => {

        const classroom =
            classrooms.find(
                c => c.id === Number(classroomId)
            );

        setLayouts(
            classroom?.layouts ?? []
        );

    }, [
        classroomId,
        classrooms
    ]);

    useEffect(() => {

        const loadClassrooms = async () => {

            const response =
                await fetch(
                    `${API_URL}/api/classrooms`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setClassrooms(data);

        };

        loadClassrooms();

    }, []);

    const save = async () => {

        const response = await fetch(
            `${API_URL}/api/group-schedules/${schedule.id}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    start_time: startTime,
                    end_time: endTime,
                    scope,
                    effective_from: effectiveFrom,
                    classroom_id: classroomId,
                    classroom_layout_id: layoutId
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
                        Redigera schema
                    </DialogTitle>

                </DialogHeader>

                <div
                    className="
                        space-y-4
                    "
                >

                    <div className="space-y-2">

                        <label>
                            Klassrum
                        </label>

                        <select
                            value={classroomId}
                            onChange={(e) =>
                                setClassroomId(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Välj klassrum
                            </option>

                            {classrooms.map(
                                classroom => (

                                    <option
                                        key={classroom.id}
                                        value={classroom.id}
                                    >
                                        {classroom.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    <div className="space-y-2">

                        <label>
                            Möblering
                        </label>

                        <select
                            value={layoutId}
                            onChange={(e) =>
                                setLayoutId(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Välj möblering
                            </option>

                            {layouts.map(
                                layout => (

                                    <option
                                        key={layout.id}
                                        value={layout.id}
                                    >
                                        {layout.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) =>
                            setStartTime(
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) =>
                            setEndTime(
                                e.target.value
                            )
                        }
                    />

                    <div className="space-y-2">

                        <div className="font-medium">
                            Tillämpa ändringen på
                        </div>

                        <label className="flex gap-2">

                            <input
                                type="radio"
                                value="all"
                                checked={scope === "all"}
                                onChange={() =>
                                    setScope("all")
                                }
                            />

                            Hela serien

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="radio"
                                value="future"
                                checked={scope === "future"}
                                onChange={() =>
                                    setScope("future")
                                }
                            />

                            Alla framtida lektioner

                        </label>
                        {scope === "future" && (

                            <div>

                                <label>
                                    Från och med<span> </span>
                                </label>

                                <input
                                    type="date"
                                    value={effectiveFrom}
                                    onChange={(e) =>
                                        setEffectiveFrom(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                        )}

                    </div>

                    <Button onClick={save}>
                        Spara
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}