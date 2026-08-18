import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import WaitingRoomCard from "@/components/ui/WaitingRoomCard";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";

export default function GroupExamWaitingRoomTab({
    groupExamId
}) {
    const [students, setStudents] = useState([]);
    const [groupExam, setGroupExam] = useState(null);

    useEffect(() => {
        load();

        const interval = setInterval(
            load,
            3000
        );

        return () =>
            clearInterval(interval);

    }, [groupExamId]);

    async function load() {

        const waitingRoomResponse =
            await fetch(
                `${API_URL}/api/group-assessments/${groupExamId}/waiting-room`,
                {
                    headers: authHeaders()
                }
            );

        const groupExamResponse =
            await fetch(
                `${API_URL}/api/group-assessments/${groupExamId}`,
                {
                    headers: authHeaders()
                }
            );

        if (waitingRoomResponse.ok) {
            setStudents(
                await waitingRoomResponse.json()
            );
        }

        if (groupExamResponse.ok) {
            setGroupExam(
                await groupExamResponse.json()
            );
        }
    }

    const admitAll = async () => {

        const response = await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/admit-all`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        console.log(
            await response.text()
        );    

        await load();

    };

    const admitStudent = async (
        userId
    ) => {

        const response = await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/admit-student`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId
                })
            }
        );

        console.log(
            await response.text()
        );

        await load();

    };


    return (
        <BaseTabLayout
            title="Väntrum"
            actions={

                <Button
                    size="lg"
                    onClick={admitAll}
                >
                    Släpp in elever
                </Button>
                
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

                    <WaitingRoomCard
                        key={student.id}
                        student={student}
                        onAdmit={admitStudent}
                    />

                ))}

            </div>

        </BaseTabLayout>
    );
}