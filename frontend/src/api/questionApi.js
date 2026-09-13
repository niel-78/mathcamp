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
        const data = await response.json().catch(() => null);
        throw new Error(
            data?.error || "Kunde inte spara fråga"
        );
    }
};

export const autoFixQuestionApi = async (questionId) => {
    const response = await fetch(
        `${API_URL}/api/questions/${questionId}/auto-fix`,
        {
            method: "POST",
            headers: authHeaders()
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
            data?.error || "Kunde inte åtgärda frågan"
        );
    }

    return await response.json();
};

export const autoFixAllQuestionsApi = async (questionIds = null) => {
    const response = await fetch(
        `${API_URL}/api/questions/auto-fix-all`,
        {
            method: "POST",
            headers: {
                ...authHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                questionIds: questionIds || undefined
            })
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
            data?.error || "Kunde inte åtgärda frågorna"
        );
    }

    return await response.json();
};