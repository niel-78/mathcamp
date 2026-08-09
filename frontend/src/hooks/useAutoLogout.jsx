import { useEffect } from "react";
import { toast } from "sonner";

export default function useAutoLogout(
    logout,
    timeoutMinutes = 30
) {

    useEffect(() => {

        let timer;

        const resetTimer = () => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                logout();

            }, timeoutMinutes * 60 * 1000);

        };

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart"
        ];

        events.forEach(event =>
            window.addEventListener(
                event,
                resetTimer
            )
        );

        timer = setTimeout(() => {

            toast.error(
                "Du har loggats ut på grund av inaktivitet."
            );

            logout();

        }, timeoutMinutes * 60 * 1000);

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