import { useEffect, useState } from "react";

export default function ExamTimer({
    attempt
}) {

    const [secondsLeft, setSecondsLeft] =
        useState(0);

    useEffect(() => {

        if (!attempt?.expires_at) {
            return;
        }

        const updateTimer = () => {

            const now = Date.now();

            const expires =
                new Date(
                    attempt.expires_at
                ).getTime();

            const diff = Math.max(
                0,
                Math.floor(
                    (expires - now) / 1000
                )
            );

            setSecondsLeft(diff);
        };

        updateTimer();

        const interval = setInterval(
            updateTimer,
            1000
        );

        return () =>
            clearInterval(interval);

    }, [attempt]);

    const hours =
        Math.floor(secondsLeft / 3600);

    const minutes =
        Math.floor(
            (secondsLeft % 3600) / 60
        );

    const seconds =
        secondsLeft % 60;

    return (
        <div className="assessment-timer">

            ⏱ Tid kvar:

            {" "}

            {String(hours).padStart(2, "0")}
            :
            {String(minutes).padStart(2, "0")}
            :
            {String(seconds).padStart(2, "0")}

        </div>
    );
}
