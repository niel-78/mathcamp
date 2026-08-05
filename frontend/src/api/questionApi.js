import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export const updateQuestion = async (
    questionId,
    payload
) => {

    const response = await fetch(
        `${API_URL}/api/questions/${questionId}`,
        {
            method: "PUT",
            headers: {
                ...authHeaders(),
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify(payload)
        }
    );

    if (!response.ok) {
        throw new Error(
            "Kunde inte spara fråga"
        );
    }
};