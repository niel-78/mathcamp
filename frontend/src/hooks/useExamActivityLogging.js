import { useEffect, useRef } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { logEvent } from "@/utils/logEvent";

export default function useExamActivityLogging(
    attemptId
) {

    const isAwayRef = useRef(false);
    const blurTimerRef = useRef(null);

    useEffect(() => {

        if (!attemptId) {
            return;
        }

        const handleBlur = () => {

            blurTimerRef.current = window.setTimeout(() => {
                if (!isAwayRef.current) {
                    isAwayRef.current = true;
                    logEvent(
                        attemptId,
                        "window_blur"
                    );
                }
            }, 100);

        };

        const handleFocus = () => {

            window.clearTimeout(blurTimerRef.current);

            if (isAwayRef.current) {
                isAwayRef.current = false;
                logEvent(
                    attemptId,
                    "window_focus"
                );
            }

        };

        const handleVisibility = () => {

            if (document.hidden) {

                window.clearTimeout(blurTimerRef.current);

                if (!isAwayRef.current) {
                    isAwayRef.current = true;
                    logEvent(
                        attemptId,
                        "tab_hidden"
                    );
                }

            } else {

                if (isAwayRef.current) {
                    isAwayRef.current = false;
                    logEvent(
                        attemptId,
                        "tab_visible"
                    );
                }

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

        const handleBeforeUnload = () => {

            logEvent(
                attemptId,
                "page_unload"
            );

            fetch(
                `${API_URL}/api/assessment-attempts/${attemptId}/submit`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        auto_submit: true
                    }),
                    keepalive: true
                }
            ).catch(() => {});

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

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );

        return () => {

            window.clearTimeout(blurTimerRef.current);
            isAwayRef.current = false;

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

            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );

        };

    }, [attemptId]);

}