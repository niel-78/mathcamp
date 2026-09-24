import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function WaitingRoomPage({
    groupExam,
    onStart,
    onLocked
}) {

    const [status, setStatus] = useState(
        groupExam.assessment_status
    );
    const handledStartRef = useRef(false);

    useEffect(() => {

        const interval = setInterval(
            async () => {

                if (handledStartRef.current) {
                    return;
                }

                const response =
                    await fetch(
                        `${API_URL}/api/group-assessment-lobby/${groupExam.group_assessment_id}/status`,
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
                    data.assessment_status
                );
                if (
                    data.attempt_status === "locked"
                ) {

                    handledStartRef.current = true;

                    clearInterval(
                        interval
                    );

                    onLocked(
                        data.attempt_id
                    );

                    return;

                }

                if (
                    data.assessment_status === "open" ||
                    data.admitted
                ) {

                    handledStartRef.current = true;

                    clearInterval(
                        interval
                    );

                    onStart();

                }

            },
            3000
        );

        return () => {
            clearInterval(interval);
        };

    }, []);

    return (

        <div className="flex min-h-[100dvh] min-w-0 items-center justify-center p-3 sm:p-6">

            <div className="w-full max-w-md rounded-xl border bg-card p-4 text-center shadow sm:p-6">

                <h1 className="text-2xl font-bold">
                    {groupExam.assessment_title}
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