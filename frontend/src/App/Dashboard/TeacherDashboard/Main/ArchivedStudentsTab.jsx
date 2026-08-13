import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";

export default function ArchivedStudentsTab() {

    const [students, setStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        loadStudents();

    }, []);

    const loadStudents = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/students`,
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

            setStudents(data);

        } finally {

            setLoading(false);

        }

    };

    const restoreStudent = async (groupId, userId) => {

        try {

            await fetch(
                `${API_URL}/api/archive/students/restore`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        group_id: groupId,
                        user_id: userId
                    })
                }
            );

            await loadStudents();

            window.dispatchEvent(
                new Event("groups-changed")
            );

        } catch (error) {

            console.error(error);

        }

};

    return (

        <BaseTabLayout
            title="Borttagna elever"
        >

            <CardSection
                title="Borttagna elever"
            >

                {loading && (
                    <div>Laddar...</div>
                )}

                {!loading &&
                students.length === 0 && (

                    <div
                        className="
                            text-sm
                            text-muted-foreground
                        "
                    >
                        Inga borttagna elever.
                    </div>

                )}

                <div className="space-y-4">

                    {students.map(student => (

                        <div
                            key={`${student.group_id}-${student.id}`}
                            className="
                                border
                                rounded-lg
                                p-4

                                flex
                                justify-between
                                items-center
                            "
                        >

                            <div>

                                <div className="font-medium">
                                    {student.first_name}
                                    {" "}
                                    {student.last_name}
                                </div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    Grupp: {student.group_name}
                                </div>

                            </div>

                            <Button
                                variant="outline"
                                onClick={() =>
                                    restoreStudent(
                                        student.group_id,
                                        student.id
                                    )
                                }
                            >
                                Återställ
                            </Button>

                        </div>

                    ))}

                </div>

            </CardSection>

        </BaseTabLayout>

    );

}