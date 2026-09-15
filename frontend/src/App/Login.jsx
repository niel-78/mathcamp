import { useState } from "react";
import { useAuth, clearUserScopedLocalStorage } from "@/contexts/AuthContext";
import { API_URL } from "@/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Login() {
    const { setUser } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            toast.error(data.error);
            return;
        }

        clearUserScopedLocalStorage();
        const token = data.token.replace(/^Bearer\s+/i, "");
        localStorage.setItem("token", token);
        sessionStorage.setItem("token", token);
        setUser(data.user);
        toast.success("Inloggning lyckades");
    };

    const handleForgotPassword = async () => {
        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            toast.error("Fyll i ditt användarnamn ovan först.");
            return;
        }

        setLoading(true);
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
                toast.error(data.error || "Kunde inte skicka ny kod.");
                return;
            }

            toast.success("Ett nytt lösenord/kod har skickats till din e-post!");
        } catch (error) {
            toast.error("Ett nätverksfel uppstod.");
        } finally {
            setLoading(false);
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

            {/* <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-foreground mt-2"
            >
                {loading ? "Skickar..." : "Glömt lösenord? Skicka nytt på mail"}
            </Button> */}
        </form>
    );
}