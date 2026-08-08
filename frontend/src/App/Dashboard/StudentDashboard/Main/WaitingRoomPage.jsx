import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function WaitingRoomPage({
    groupExam,
    onStart
}) {

    const [status, setStatus] = useState(
        groupExam.exam_status
    );

    useEffect(() => {

        const interval = setInterval(
            async () => {

                const response =
                    await fetch(
                        `${API_URL}/api/group-exam-lobby/${groupExam.group_exam_id}/status`,
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

                setStatus(
                    data.exam_status
                );

                if (
                    data.exam_status === "open"
                ) {

                    clearInterval(
                        interval
                    );

                    onStart();

                }

            },
            3000
        );

        return () =>
            clearInterval(interval);

    }, []);

    return (

        <div className="flex min-h-screen items-center justify-center">

            <div className="max-w-md rounded-xl border bg-white p-6 text-center shadow">

                <h1 className="text-2xl font-bold">
                    {groupExam.exam_title}
                </h1>

                <p className="mt-4">
                    Du är ansluten till väntrummet.
                </p>

                <p className="text-muted-foreground mt-2">
                    Väntar på att läraren startar provet...
                </p>

            </div>

        </div>

    );

}