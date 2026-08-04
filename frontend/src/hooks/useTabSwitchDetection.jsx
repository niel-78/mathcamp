import { useEffect } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export function useTabSwitchDetection() {

    useEffect(() => {

        const handleVisibilityChange = async () => {

            if (!document.hidden) {
                return;
            }

            try {

                await fetch(
                    `${API_URL}/api/events`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...authHeaders()
                        },
                        body: JSON.stringify({
                            type: "tab_switch"
                        })
                    }
                );

            } catch (error) {

                console.error(
                    "Kunde inte rapportera tab byte",
                    error
                );
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };

    }, []);
}