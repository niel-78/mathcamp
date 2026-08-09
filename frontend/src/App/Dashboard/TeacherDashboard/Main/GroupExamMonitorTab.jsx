import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { eventLabels } from "@/constants/eventLabels";
import DetailLayout from "@/components/layouts/DetailLayout";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import StudentMonitorCard from "@/components/ui/StudentMonitorCard";
import CardSection from "@/components/layouts/CardSection";

export default function GroupExamMonitorTab({
    groupExamId
}) {

    const [students, setStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [selectedStudent, setSelectedStudent] =
        useState(null);

    const [events, setEvents] =
        useState([]);

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

        if (!selectedStudent) {
            return;
        }

        loadEvents(
            selectedStudent.user_id
        );

        const interval = setInterval(() => {

            loadEvents(
                selectedStudent.user_id
            );

        }, 3000);

        return () =>
            clearInterval(interval);

    }, [selectedStudent]);

    const load = async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/group-exams/${groupExamId}/monitor`,
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
            `${API_URL}/api/group-exams/${groupExamId}/students/${userId}/events`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setEvents(data);

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

return (

    <BaseTabLayout
        title="Övervakning"
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

                                    {selectedStudent.status ===
                                        "in_progress" &&
                                        "Pågående"}

                                    {selectedStudent.status ===
                                        "submitted" &&
                                        "Inlämnad"}

                                    {!selectedStudent.status &&
                                        "Ej startat"}

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
                        selected={
                            selectedStudent?.user_id ===
                            student.user_id
                        }
                        onSelect={() => {

                            setSelectedStudent(
                                student
                            );

                            loadEvents(
                                student.user_id
                            );

                        }}
                    />

                ))}

            </div>

        </DetailLayout>

    </BaseTabLayout>

);

}

