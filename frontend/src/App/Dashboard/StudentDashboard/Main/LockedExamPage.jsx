import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { reasonLabels } from "@/constants/reasonLabels";

export default function LockedExamPage({
    attemptId,
    onUnlocked
}) {

    const [reason, setReason] =
        useState(null);

    
    useEffect(() => {

        const interval = setInterval(
            async () => {

                const response = await fetch(
                    `${API_URL}/api/assessment-attempts/${attemptId}`,
                    {
                        headers: authHeaders()
                    }
                );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();


                if (
                    data.attempt?.status ===
                    "in_progress"
                ) {

                    clearInterval(
                        interval
                    );


                    await fetch(
                        `${API_URL}/api/events`,
                        {
                            method: "POST",
                            headers: {
                                ...authHeaders(),
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                attempt_id: attemptId,
                                event_type:
                                    "attempt_resumed_after_lock"
                            })
                        }
                    );

                    onUnlocked();

                }

            },
            3000
        );

        return () =>
            clearInterval(interval);

    }, [
        attemptId,
        onUnlocked
    ]);


    useEffect(() => {

        const loadReason = async () => {

            const response = await fetch(
                `${API_URL}/api/events/attempt/${attemptId}/lock-reason`,
                {
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setReason(
                data.reason
            );

        };

        if (attemptId) {
            loadReason();
        }

    }, [attemptId]);

    return (

        <div className="
            flex
            min-h-screen
            items-center
            justify-center
            bg-muted/20
            p-6
        ">

            <div className="
                max-w-lg
                rounded-xl
                border
                bg-white
                p-8
                text-center
                shadow-sm
            ">

                <ShieldAlert
                    className="
                        mx-auto
                        mb-4
                        h-12
                        w-12
                        text-destructive
                    "
                />

                <h1 className="text-2xl font-bold">
                    Provet har låsts
                </h1>

                <p className="
                    mt-4
                    text-muted-foreground
                ">
                    En aktivitet registrerades
                    under provets genomförande som
                    enligt provets säkerhetsinställningar
                    medför att provet automatiskt låstes.
                </p>

                {reason && (

                    <p className="
                        mt-4
                        font-medium
                    ">
                        Orsak:{" "}
                        {
                            reasonLabels[reason]
                            || reason
                        }
                    </p>

                )}

                <p className="
                    mt-4
                    text-muted-foreground
                ">
                    Kontakta din lärare för att
                    återuppta provet.
                </p>

            </div>

        </div>

    );

}