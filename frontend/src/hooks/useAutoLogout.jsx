import { useEffect } from "react";
import { toast } from "sonner";

export const activeExamSessionStorageKey = "math-camp-active-exam";

export default function useAutoLogout(
    logout,
    timeoutMinutes = 30
) {

    useEffect(() => {

        let timer;

        const handleTimeout = () => {

            if (sessionStorage.getItem(activeExamSessionStorageKey) === "true") {
                resetTimer();
                return;
            }

            toast.error(
                "Du har loggats ut på grund av inaktivitet."
            );

            logout();

        };

        const resetTimer = () => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                handleTimeout();

            }, timeoutMinutes * 60 * 1000);

        };

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
            "math-camp-user-activity"
        ];

        events.forEach(event =>
            window.addEventListener(
                event,
                resetTimer
            )
        );

        resetTimer();

        return () => {

            clearTimeout(timer);

            events.forEach(event =>
                window.removeEventListener(
                    event,
                    resetTimer
                )
            );

        };

    }, [logout, timeoutMinutes]);

}