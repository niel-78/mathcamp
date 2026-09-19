import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, clearUserScopedLocalStorage } from "@/contexts/AuthContext";
import { API_URL, APP_VERSION } from "@/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Login() {
    const { setUser } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(() =>
        Boolean(new URLSearchParams(window.location.search).get("login_token"))
    );
    const [resetLoading, setResetLoading] = useState(false);
    const loginLinkAttempted = useRef(false);

    const completeLogin = useCallback((data) => {
        clearUserScopedLocalStorage();
        const token = data.token.replace(/^Bearer\s+/i, "");
        localStorage.setItem("token", token);
        sessionStorage.setItem("token", token);
        setUser(data.user);
        toast.success("Inloggning lyckades");
    }, [setUser]);

    useEffect(() => {
        const loginToken = new URLSearchParams(window.location.search)
            .get("login_token");

        if (!loginToken) {
            return;
        }

        if (loginLinkAttempted.current) {
            return;
        }

        loginLinkAttempted.current = true;

        fetch(`${API_URL}/api/auth/login-with-link`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: loginToken,
                program_version: APP_VERSION
            })
        })
            .then(async res => {
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Länken kunde inte användas.");
                }

                completeLogin(data);
                window.history.replaceState({}, "", window.location.pathname);
            })
            .catch(error => toast.error(error.message))
            .finally(() => setLoading(false));
    }, [completeLogin]);

    const handleLogin = async (e) => {
        e.preventDefault();

        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password,
                program_version: APP_VERSION
            })
        });

        const data = await res.json();

        if (!res.ok) {
            toast.error(data.error);
            return;
        }

        completeLogin(data);
    };

    const handleLoginLink = async () => {
        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            toast.error("Fyll i ditt användarnamn först.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/request-login-link`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username: trimmedUsername })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Kunde inte skicka länken.");
            }

            toast.success(data.message);
        } catch (error) {
            toast.error(error.message || "Ett nätverksfel uppstod.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            toast.error("Fyll i ditt användarnamn först.");
            return;
        }

        setResetLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username: trimmedUsername })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Kunde inte återställa lösenordet.");
            }

            toast.success(data.message || "Ett nytt lösenord har skickats till din e-post.");
        } catch (error) {
            toast.error(error.message || "Ett nätverksfel uppstod.");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleLogin}
            className="
                max-w-md
                mx-auto
                mt-20
                p-6
                rounded-xl
                border
                bg-card
                text-card-foreground
                shadow-lg
                flex
                flex-col
                gap-4
            "
        >
            <h2 className="text-2xl font-bold text-center">
                Login
            </h2>

            <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Användarnamn"
                className="
                    border
                    rounded-lg
                    px-4
                    py-2
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                "
            />

            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lösenord"
                className="
                    border
                    rounded-lg
                    px-4
                    py-2
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                "
            />

            <Button
                type="submit"
                variant="outline"
            >
                Logga in
            </Button>

            <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={handleLoginLink}
                className="text-xs text-muted-foreground hover:text-foreground mt-2"
            >
                {loading ? "Skickar..." : "Skicka inloggningslänk på mail"}
            </Button>

            <Button
                type="button"
                variant="ghost"
                disabled={resetLoading}
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-foreground"
            >
                {resetLoading ? "Skickar..." : "Glömt lösenord?"}
            </Button>
        </form>
    );
}