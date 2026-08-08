import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DetailLayout from "@/components/layouts/DetailLayout";
import CardSection from "@/components/layouts/CardSection";
import ExamPreview from "@/components/ui/ExamPreview";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
                `${API_URL}/api/group-exams/${groupExamId}/waiting-room`,
                {
                    headers: authHeaders()
                }
            );

        const groupExamResponse =
            await fetch(
                `${API_URL}/api/group-exams/${groupExamId}`,
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

    const openExam = async () => {

        const response = await fetch(
            `${API_URL}/api/group-exams/${groupExamId}/open`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        load();
    };

    return (
        <BaseTabLayout
            title="Väntrum"
            actions={
            <Button
                size="lg"
                onClick={openExam}
            >
                Släpp in elever
            </Button>
            }
        >
            <CardSection title="Anslutna elever">

                <div className="space-y-2">

                    {students.map(student => (

                        <div
                            key={student.id}
                            className="
                                flex
                                justify-between
                                border
                                rounded
                                p-3
                            "
                        >
                            <span>
                                {student.first_name}
                                {" "}
                                {student.last_name}
                            </span>

                            <span>
                                Ansluten
                            </span>

                        </div>

                    ))}

                </div>

            </CardSection>
        </BaseTabLayout>
    );
}