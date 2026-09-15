export function authHeaders() {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        "";

    return {
        Authorization: token.replace(/^Bearer\s+/i, "")
    };
}