import { useEffect } from "react";

import { logEvent } from "@/utils/logEvent";

export default function useExamActivityLogging(
    attemptId
) {

    useEffect(() => {

        if (!attemptId) {
            return;
        }

        const handleBlur = () => {

            logEvent(
                attemptId,
                "window_blur"
            );

        };

        const handleFocus = () => {

            logEvent(
                attemptId,
                "window_focus"
            );

        };

        const handleVisibility = () => {

            if (document.hidden) {

                logEvent(
                    attemptId,
                    "tab_hidden"
                );

            } else {

                logEvent(
                    attemptId,
                    "tab_visible"
                );

            }

        };

        const handleContextMenu = (
            event
        ) => {

            event.preventDefault();

            logEvent(
                attemptId,
                "context_menu"
            );

        };

        window.addEventListener(
            "blur",
            handleBlur
        );

        window.addEventListener(
            "focus",
            handleFocus
        );

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        document.addEventListener(
            "contextmenu",
            handleContextMenu
        );

        return () => {

            window.removeEventListener(
                "blur",
                handleBlur
            );

            window.removeEventListener(
                "focus",
                handleFocus
            );

            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );

            document.removeEventListener(
                "contextmenu",
                handleContextMenu
            );

        };

    }, [attemptId]);

}