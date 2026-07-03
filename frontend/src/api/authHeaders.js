export function authHeaders() {
    return {
        Authorization: localStorage.getItem("token")
    };
}