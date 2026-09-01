import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import useAutoLogout from "@/hooks/useAutoLogout";
import { useAppSettings } from "@/contexts/AppSettingsContext";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { appSettings } = useAppSettings();

    useEffect(() => {

        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        fetch(
            `${API_URL}/api/auth/me`,
            {
                headers: authHeaders()
            }
        )
            .then(async res => {

                if (!res.ok) {
                    throw new Error("Unauthorized");
                }

                return res.json();

            })
            .then(data => {

                setUser(data);

                setLoading(false);

            })
            .catch(error => {

                console.error(error);

                localStorage.removeItem("token");

                setUser(null);

                setLoading(false);

            });

    }, []);

    const token = localStorage.getItem("token");

    const logout = useCallback(async () => {

        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            setUser(null);
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/auth/logout`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            if (!response.ok && response.status !== 401) {
                throw new Error("Logout failed");
            }

        } catch (error) {

            console.error(error);

        } finally {

            localStorage.removeItem("token");
            setUser(null);

        }

    }, []);

    useAutoLogout(
        logout,
        appSettings
            .default_auto_logout_minutes
            ?? 15
    );

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
    }

    export function useAuth() {
    return useContext(AuthContext);
}
