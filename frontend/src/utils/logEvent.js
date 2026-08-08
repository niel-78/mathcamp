import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export async function logEvent(
    attemptId,
    eventType,
    eventData = {}
) {

    try {

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
                    event_type: eventType,
                    event_data: eventData
                })
            }
        );

    } catch (error) {

        console.error(error);

    }

}