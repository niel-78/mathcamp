let inMemoryToken = "";

export function rememberAuthToken(token) {
    inMemoryToken = token || "";
}

export function clearRememberedAuthToken() {
    inMemoryToken = "";
}

export function authHeaders() {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        inMemoryToken;

    if (token) {
        inMemoryToken = token;
    }

    return {
        Authorization: token
            ? `Bearer ${token.replace(/^Bearer\s+/i, "")}`
            : ""
    };
}