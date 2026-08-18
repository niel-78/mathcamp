import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { eventLabels } from "@/constants/eventLabels";
import DetailLayout from "@/components/layouts/DetailLayout";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import StudentMonitorCard from "@/components/ui/StudentMonitorCard";
import CardSection from "@/components/layouts/CardSection";
import FormatTime from "@/utils/FormatTime";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    statusLabels,
    statusClasses
} from "@/constants/studentStatuses";


export default function GroupExamMonitorTab({
    groupExamId
}) {

    const [students, setStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [selectedStudentId, setSelectedStudentId
    ] = useState(null);

    const [events, setEvents] =
        useState([]);

    const [terminateAllOpen,
        setTerminateAllOpen] =
        useState(false);

    const selectedStudent =
        students.find(
            student =>
                student.user_id ===
                selectedStudentId
        ) || null;

    useEffect(() => {

        load();

        const interval = setInterval(
            load,
            3000
        );

        return () =>
            clearInterval(interval);

    }, [groupExamId]);

    useEffect(() => {

        if (!selectedStudentId) {
            return;
        }

        loadEvents(
            selectedStudentId
        );

        const interval = setInterval(() => {

            loadEvents(
                selectedStudent.user_id
            );

        }, 3000);

        return () =>
            clearInterval(interval);

    }, [selectedStudentId]);

    const handleTerminateAll =
        async () => {

            await terminateAll();

            setTerminateAllOpen(false);

        };
    
    const load = async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/group-assessments/${groupExamId}/monitor`,
                {
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setStudents(data);


        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const loadEvents = async (userId) => {

        const response = await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/students/${userId}/events`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        //setEvents(data);

        const parsedEvents = data.map(event => {

            let eventData = {};

            try {

                eventData =
                    typeof event.event_data === "string"
                        ? JSON.parse(event.event_data)
                        : (
                            event.event_data || {}
                        );

            } catch {

                eventData = {};

            }

            return {
                ...event,
                event_data: eventData
            };

        });

        setEvents(parsedEvents);

    };

    const terminateAttempt =
        async (attemptId) => {

            await fetch(
                `${API_URL}/api/assessment-attempts/${attemptId}/terminate`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            await load();

            if (selectedStudent?.user_id) {

                await loadEvents(
                    selectedStudent.user_id
                );

            }

        };

    const resumeAttempt =
        async (attemptId) => {

            await fetch(
                `${API_URL}/api/assessment-attempts/${attemptId}/resume`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            await load();

            if (selectedStudent?.user_id) {

                await loadEvents(
                    selectedStudent.user_id
                );

            }

        };
    
    const terminateAll = async () => {

        await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/terminate-all`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        load();

    };

    const total =
        students.length;

    const started =
        students.filter(
            s => s.status === "in_progress"
        ).length;

    const submitted =
        students.filter(
            s => s.status === "submitted"
        ).length;


    function getStudentStatus(student) {

        if (
            student.status === "in_progress"
        ) {
            return "in_progress";
        }

        if (
            student.status === "locked"
        ) {
            return "locked";
        }

        if (
            student.joined_at
        ) {
            return "waiting_room";
        }

        if (
            student.status === "submitted"
        ) {
            return "submitted";
        }

        return "not_joined";

    }

    const selectedStudentStatus =
        selectedStudent
            ? getStudentStatus(
                selectedStudent
            )
            : null;


return (

    <BaseTabLayout
        title="Övervakning"

            actions={

                <AlertDialog
                    open={terminateAllOpen}
                    onOpenChange={
                        setTerminateAllOpen
                    }
                >

                    <AlertDialogTrigger
                        render={
                            <Button
                                variant="destructive"
                            />
                        }
                    >
                        Avsluta alla prov
                    </AlertDialogTrigger>

                    <AlertDialogContent>

                        <AlertDialogHeader>

                            <AlertDialogTitle>
                                Avsluta alla prov?
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                                Samtliga pågående prov kommer att
                                avslutas och lämnas in omedelbart.
                                Åtgärden kan inte ångras.
                            </AlertDialogDescription>

                        </AlertDialogHeader>

                        <AlertDialogFooter>

                            <AlertDialogCancel>
                                Avbryt
                            </AlertDialogCancel>

                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleTerminateAll}
                            >
                                Avsluta alla
                            </AlertDialogAction>

                        </AlertDialogFooter>

                    </AlertDialogContent>

                </AlertDialog>

            }
    >

        <DetailLayout

            sidebar={

                !selectedStudent ? (

                    <CardSection
                        title="Information"
                    >

                        <p className="text-muted-foreground">
                            Välj en elev för att visa detaljer.
                        </p>

                    </CardSection>

                ) : (

                    <>

                        <CardSection
                            title="Information"
                        >

                            <div className="space-y-2">

                                <div>

                                    <strong>Elev:</strong>
                                    {" "}
                                    {selectedStudent.first_name}
                                    {" "}
                                    {selectedStudent.last_name}

                                </div>

                                <div>

                                    <strong>Status:</strong>
                                    {" "}

                                    <div
                                        className={`
                                            ${statusClasses[selectedStudentStatus]}
                                            font-medium
                                        `}
                                    >
                                        {statusLabels[selectedStudentStatus]}
                                    </div>

                                </div>

                                <div>

                                    <strong>Start:</strong>
                                    {" "}

                                    {selectedStudent.started_at
                                        ? (
                                            <FormatTime
                                                value={
                                                    selectedStudent.started_at
                                                }
                                            />
                                        )
                                        : "-"}

                                </div>

                                <div>

                                    <strong>IP-adress:</strong>
                                    {" "}
                                    {selectedStudent.started_ip || "-"}

                                </div>

                                <div>

                                    <strong>User Agent:</strong>

                                    <div
                                        className="
                                            mt-1
                                            break-all
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >

                                        {
                                            selectedStudent.started_user_agent
                                            || "-"
                                        }

                                    </div>

                                </div>

                            </div>

                        </CardSection>

                        <CardSection
                            title={`Händelser (${events.length})`}
                        >

                            {!events.length ? (

                                <p className="text-muted-foreground">
                                    Inga händelser registrerade.
                                </p>

                            ) : (

                                <div className="space-y-2">

                                    {events.map(event => (

                                        <div
                                            key={event.id}
                                            className="
                                                rounded-lg
                                                border
                                                p-3
                                            "
                                        >

                                            <div className="font-medium">

                                                {
                                                    eventLabels[
                                                        event.event_type
                                                    ] ||
                                                    event.event_type
                                                }

                                            </div>

                                            <div
                                                className="
                                                    text-xs
                                                    text-muted-foreground
                                                "
                                            >

                                                <FormatTime
                                                    value={
                                                        event.created_at
                                                    }
                                                />

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </CardSection>

                    </>

                )

            }

        >

            <div
                className="
                    grid
                    gap-4
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                "
            >

                {students.map(student => (

                    <StudentMonitorCard
                        key={student.user_id}
                        student={student}
                        status={getStudentStatus(student)}
                        selected={
                            selectedStudent?.user_id ===
                            student.user_id
                        }
                        onSelect={() => {

                            setSelectedStudentId(
                                student.user_id
                            );

                            loadEvents(
                                student.user_id
                            );

                        }}
                        onTerminate={() => {
                                terminateAttempt(
                                    student.attempt_id
                                )
                            }
                        }
                        onResume={() =>
                            resumeAttempt(
                                student.attempt_id
                            )
                        }
                    />

                ))}

            </div>

        </DetailLayout>

    </BaseTabLayout>

);

}

