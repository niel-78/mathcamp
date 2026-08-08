import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";

export default function GroupExamMonitorTab({
    groupExamId
}) {

    const [students, setStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        load();

        const interval = setInterval(
            load,
            3000
        );

        return () =>
            clearInterval(interval);

    }, [groupExamId]);

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
            title="Provövervakning"
        >

            <div className="space-y-6">

                <CardSection title="Översikt">

                    <div className="grid grid-cols-3 gap-4">

                        <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">
                                Totalt
                            </div>

                            <div className="text-3xl font-bold">
                                {total}
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">
                                Skriver nu
                            </div>

                            <div className="text-3xl font-bold text-blue-600">
                                {started}
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">
                                Inlämnade
                            </div>

                            <div className="text-3xl font-bold text-green-600">
                                {submitted}
                            </div>
                        </div>

                    </div>

                </CardSection>

                <CardSection
                    title={`Elever (${students.length})`}
                >

                    {loading ? (

                        <p>Laddar...</p>

                    ) : (

                        <div className="space-y-2">

                            {students.map(student => (

                                <div
                                    key={student.user_id}
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        rounded-lg
                                        border
                                        p-3
                                    "
                                >

                                <div>

                                    <div className="font-medium">
                                        {student.first_name}
                                        {" "}
                                        {student.last_name}
                                    </div>

                                    {student.started_at && (

                                        <div className="text-sm text-muted-foreground">
                                            Start:
                                            {" "}
                                            {student.started_at}
                                        </div>

                                    )}

                                    {student.started_ip && (

                                        <div className="text-sm text-muted-foreground">
                                            IP:
                                            {" "}
                                            {student.started_ip}
                                        </div>

                                    )}

                                    {student.started_user_agent && (

                                        <div className="text-xs text-muted-foreground break-all">
                                            {student.started_user_agent}
                                        </div>

                                    )}

                                </div>

                                    <div>

                                        {student.status === "submitted" && (
                                            <span className="text-green-600 font-medium">
                                                Inlämnad
                                            </span>
                                        )}

                                        {student.status === "in_progress" && (
                                            <span className="text-blue-600 font-medium">
                                                Pågående
                                            </span>
                                        )}

                                        {!student.status && (
                                            <span className="text-muted-foreground">
                                                Ej startat
                                            </span>
                                        )}

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </CardSection>

            </div>

        </BaseTabLayout>

    );

}