import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Pin } from "lucide-react";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import ShuffleSeatsDialog from "./ShuffleSeatsDialog";
import SaveLayoutSnapshotDialog from "./SaveLayoutSnapshotDialog";

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
    const [studentView, setStudentView] = useState(false);
    const [saveSnapshotDialogOpen, setSaveSnapshotDialogOpen] = useState(false);
    const [showDisplayNames, setShowDisplayNames] = useState(true);


    useEffect(() => {

        const initialize = async () => {

            await applyLayout();

            await load();

        };

        initialize();

    }, [layoutId]);

    useEffect(() => {

        if (!layoutId) {
            return;
        }

        const initialize = async () => {

            await applyLayout();

            await load();

        };

        initialize();

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

    useEffect(() => {

        const handleLayoutUpdated =
            async (event) => {

                if (
                    event.detail.layoutId !==
                    layoutId
                ) {
                    return;
                }

                await load();

            };

        window.addEventListener(
            "classroom-layout-updated",
            handleLayoutUpdated
        );

        return () => {

            window.removeEventListener(
                "classroom-layout-updated",
                handleLayoutUpdated
            );

        };

    }, [layoutId]);

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
    
    const applyLayout = async () => {

        await fetch(
            `${API_URL}/api/groups/${groupId}/seat-assignments/apply-layout`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    layoutId
                })
            }
        );

    };

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
        
    const CANVAS_WIDTH = 1200;
    const SEAT_WIDTH = 120;

    const PRESENTATION_SCALE = 1.8;

    const minX = Math.min(
        ...seats.map(
            seat => Number(seat.x_position)
        )
    );

    const maxX = Math.max(
        ...seats.map(
            seat => Number(seat.x_position)
        )
    );

    const minY = Math.min(
        ...seats.map(
            seat => Number(seat.y_position)
        )
    );

    const maxY = Math.max(
        ...seats.map(
            seat => Number(seat.y_position)
        )
    );

    const seatWidth =
        studentView
            ? 220
            : 120;

    const classroomWidth =
        maxX + seatWidth + 100;

    return (
        <>
            <BaseTabLayout
                title={
                    layout?.name ??
                    "Sittplacering"
                }
                actions={
                    <div className="flex gap-2">

                        {!studentView && (

                            <Button
                                variant="outline"
                                onClick={() =>
                                    setShuffleDialogOpen(true)
                                }
                            >
                                Slumpa platser
                            </Button>

                        )}

                        <Button
                            variant="outline"
                            onClick={() =>
                                setStudentView(
                                    prev => !prev
                                )
                            }
                        >
                            {
                                studentView
                                    ? "Lärarvy"
                                    : "Elevvy"
                            }
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setShowDisplayNames(
                                    previous => !previous
                                )
                            }
                        >
                            {
                                showDisplayNames
                                    ? "Visa fullständiga namn"
                                    : "Visa visningsnamn"
                            }
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setSaveSnapshotDialogOpen(
                                    true
                                )
                            }
                        >
                            Spara placering
                        </Button>

                    </div>
                }
            >

                <div
                    className={
                        studentView
                            ? `
                                presentation-shell-fullscreen
                            `
                            : `
                                relative
                                bg-slate-50
                                border
                                rounded-lg
                                w-full
                                h-[700px]
                            `
                    }
                >

                    <div
                        className={
                            studentView
                                ? `
                                    presentation-slide-fullscreen
                                    relative
                                `
                                : `
                                    relative
                                    w-full
                                    h-full
                                `
                        }
                    >

                        {seats.map(seat => {

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

                            const seatWidth =
                                studentView
                                    ? 220
                                    : 120;

                            const seatHeight =
                                studentView
                                    ? 120
                                    : 64;

                            const x =
                                Number(seat.x_position);

                            const left =
                                studentView
                                    ? minX +
                                    (maxX - x) * PRESENTATION_SCALE
                                    : x;

                            const top =
                                studentView
                                    ? minY +
                                    (maxY - Number(seat.y_position)) *
                                    PRESENTATION_SCALE
                                    : Number(seat.y_position);

                            return (

                                <div
                                    key={seat.id}
                                    draggable={
                                        !studentView &&
                                        !!assignment &&
                                        assignment.pinned !== 1
                                    }
                                    onDragStart={() => {

                                        if (
                                            !assignment ||
                                            studentView
                                        ) {
                                            return;
                                        }

                                        setDraggedAssignmentId(
                                            assignment.id
                                        );

                                    }}
                                    onDragOver={(e) => {

                                        if (
                                            studentView
                                        ) {
                                            return;
                                        }

                                        e.preventDefault();

                                    }}
                                    onDrop={async (e) => {

                                        if (
                                            studentView
                                        ) {
                                            return;
                                        }

                                        e.preventDefault();

                                        if (
                                            !draggedAssignmentId
                                        ) {
                                            return;
                                        }

                                        await swapSeats(
                                            draggedAssignmentId,
                                            seat.id
                                        );

                                    }}
                                    className="
                                        absolute
                                        bg-card
                                        text-card-foreground
                                        border
                                        border-border
                                        rounded-xl
                                        shadow-sm
                                        flex
                                        items-center
                                        justify-center
                                        text-center
                                        px-2
                                    "
                                    style={{
                                        width: seatWidth,
                                        height: seatHeight,
                                        left,
                                        top
                                    }}
                                >

                                    {student ? (

                                        <div
                                            className="
                                                flex
                                                flex-col
                                                items-center
                                                justify-center
                                            "
                                        >

                                            {!studentView && (

                                                <Pin
                                                    onClick={async (e) => {

                                                        e.stopPropagation();

                                                        await togglePinned(
                                                            assignment.id
                                                        );

                                                    }}
                                                    className={`
                                                        absolute
                                                        top-1
                                                        right-1
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

                                            )}

                                            {studentView ? (
                                                <>
                                                    {!showDisplayNames ? (
                                                        <>
                                                            <div>
                                                                {student.first_name}
                                                            </div>

                                                            <div
                                                                className="
                                                                    text-xs
                                                                    text-muted-foreground
                                                                "
                                                            >
                                                                {student.last_name}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div>
                                                            {student.display_name || student.first_name}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (

                                                <>
                                                    {!showDisplayNames ? (
                                                        <>
                                                            <div>
                                                                {student.first_name}
                                                            </div>

                                                            <div
                                                                className="
                                                                    text-xs
                                                                    text-muted-foreground
                                                                "
                                                            >
                                                                {student.last_name}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div>
                                                            {student.display_name || student.first_name}
                                                        </div>
                                                    )}
                                                </>

                                            )}

                                        </div>

                                    ) : (

                                        !studentView && (

                                            <div
                                                className="
                                                    text-xs
                                                    text-muted-foreground
                                                "
                                            >
                                                Tom plats
                                            </div>

                                        )

                                    )}

                                </div>

                            );

                        })}

                    </div>

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
            <SaveLayoutSnapshotDialog
                open={
                    saveSnapshotDialogOpen
                }
                onOpenChange={
                    setSaveSnapshotDialogOpen
                }
                groupId={groupId}
                layoutId={layoutId}
            />
        </>

    );

}
