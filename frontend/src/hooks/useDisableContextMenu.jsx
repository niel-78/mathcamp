import { useEffect } from "react";
import { logEvent } from "@/utils/logEvent";

export function useDisableContextMenu(
    attemptId
) {

    useEffect(() => {

        const handleContextMenu = (event) => {

            event.preventDefault();

            if (attemptId) {

                logEvent(
                    attemptId,
                    "context_menu"
                );

            }

        };

        document.addEventListener(
            "contextmenu",
            handleContextMenu
        );

        return () => {

            document.removeEventListener(
                "contextmenu",
                handleContextMenu
            );

        };

    }, [attemptId]);

}