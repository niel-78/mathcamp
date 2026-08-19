import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Pin } from "lucide-react";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import ShuffleSeatsDialog from "./ShuffleSeatsDialog";

export default function GroupLayoutTab({
    groupId,
    layoutId
}) {

    const [layout, setLayout] = useState(null);
    const [seats, setSeats] = useState([]);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [draggedAssignmentId, setDraggedAssignmentId] = useState(null);
    const [shuffleDialogOpen, setShuffleDialogOpen] = useState(false);

    useEffect(() => {

            load();

        }, [layoutId]);

    useEffect(() => {

        window.addEventListener(
            "student-created",
            handleStudentCreated
        );

        return () => {

            window.removeEventListener(
                "student-created",
                handleStudentCreated
            );

        };

    }, [groupId]);

    const load = async () => {

        const layoutResponse =
            await fetch(
                `${API_URL}/api/classroom-layouts/${layoutId}`,
                {
                    headers:
                        authHeaders()
                }
            );

        if (layoutResponse.ok) {

            setLayout(
                await layoutResponse.json()
            );

        }

        const seatsResponse =
            await fetch(
                `${API_URL}/api/classroom-layouts/${layoutId}/seats`,
                {
                    headers:
                        authHeaders()
                }
            );

        if (seatsResponse.ok) {

            setSeats(
                await seatsResponse.json()
            );

        }

        const studentsResponse =
            await fetch(
                `${API_URL}/api/groups/${groupId}/students`,
                {
                    headers: authHeaders()
                }
            );

        if (studentsResponse.ok) {

            const data =
                await studentsResponse.json();

            setStudents(
                data.students || []
            );

        }

        const assignmentsResponse =
            await fetch(
                `${API_URL}/api/groups/${groupId}/seat-assignments`,
                {
                    headers: authHeaders()
                }
            );

        if (assignmentsResponse.ok) {

            const data =
                await assignmentsResponse.json();

            setAssignments(data);

            if (data.length === 0) {

                const response =
                    await fetch(
                        `${API_URL}/api/groups/${groupId}/seat-assignments/generate`,
                        {
                            method: "POST",
                            headers: authHeaders()
                        }
                    );

                if (!response.ok) {
                    return;
                }

                const refreshed =
                    await fetch(
                        `${API_URL}/api/groups/${groupId}/seat-assignments`,
                        {
                            headers: authHeaders()
                        }
                    );

                if (refreshed.ok) {

                    setAssignments(
                        await refreshed.json()
                    );

                }

                return;
            }

        }
    }    

    const togglePinned =
        async (assignmentId) => {

            const response =
                await fetch(
                    `${API_URL}/api/group-seat-assignments/${assignmentId}/pin`,
                    {
                        method: "PUT",
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            await load();
        };

        const swapSeats =
            async (
                assignmentId,
                targetSeatId
            ) => {

                const response =
                    await fetch(
                        `${API_URL}/api/group-seat-assignments/swap`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                ...authHeaders()
                            },
                            body: JSON.stringify({
                                assignmentId,
                                targetSeatId
                            })
                        }
                    );

                if (!response.ok) {

                    console.error(
                        "Swap failed"
                    );

                    return;
                }

                await load();

            };

    const handleStudentCreated =
        async (event) => {

            if (
                event.detail.groupId !==
                groupId
            ) {
                return;
            }

            await fetch(
                `${API_URL}/api/groups/${groupId}/seat-assignments/sync`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            await load();

        };        

    return (
        <>
            <BaseTabLayout
                title={
                    layout?.name ??
                    "Sittplacering"
                }
                actions={
                    <Button
                        variant="outline"
                        onClick={() =>
                            setShuffleDialogOpen(true)
                        }
                    >
                        Slumpa platser
                    </Button>

                }
            >

                <div
                    className="
                        relative
                        bg-slate-50
                        border
                        rounded-lg
                        w-full
                        h-[700px]
                    "
                >

                {seats.map((seat, index) => {

                    const assignment =
                        assignments.find(
                            a =>
                                a.classroom_seat_id ===
                                seat.id
                        );

                    const student =
                        students.find(
                            s =>
                                s.id ===
                                assignment?.student_id
                        );

                    return (

                        <div
                            key={seat.id}
                            draggable={
                                !!assignment &&
                                assignment.pinned !== 1
                            }
                            onDragStart={() => {

                                setDraggedAssignmentId(
                                    assignment.id
                                );

                            }}
                            onDragOver={(e) => {

                                e.preventDefault();

                            }}
                            onDrop={async (e) => {

                                e.preventDefault();

                                if (!draggedAssignmentId) {
                                    return;
                                }

                                await swapSeats(
                                    draggedAssignmentId,
                                    seat.id
                                );

                            }}
                            className="
                                absolute
                                border
                                rounded
                                bg-white
                                shadow-sm
                                flex
                                items-center
                                justify-center
                                text-center
                                px-2
                            "
                            style={{
                                width: "120px",
                                height: "64px",
                                left: Number(
                                    seat.x_position
                                ),
                                top: Number(
                                    seat.y_position
                                )
                            }}
                        >

                            {student ? (
                                <div
                                    key={seat.id}
                                    className="
                                        absolute
                                    "
                                >
                                <Pin
                                    onClick={async (e) => {

                                        e.stopPropagation();

                                        await togglePinned(
                                            assignment.id
                                        );

                                    }}
                                    className={`
                                        absolute
                                        -top-1
                                        -right-6
                                        h-4
                                        w-4
                                        cursor-pointer
                                        ${
                                            assignment?.pinned === 1
                                                ? "text-amber-500 fill-amber-500"
                                                : "text-slate-400"
                                        }
                                    `}
                                />

                                    <div>
                                        {student.first_name}
                                    </div>

                                    <div 
                                    className="
                                        text-xs
                                        text-muted-foreground
                                    ">
                                        {student.last_name}
                                    </div>
                                </div>

                            ) : (

                                <div
                                    className="
                                        text-xs
                                        text-muted-foreground
                                    "
                                >
                                    Tom plats
                                </div>

                            )}

                        </div>

                    );

                })}

                </div>

            </BaseTabLayout>
            <ShuffleSeatsDialog
                open={shuffleDialogOpen}
                onOpenChange={
                    setShuffleDialogOpen
                }
                groupId={groupId}
                onCompleted={load}
            />
        </>

    );

}
