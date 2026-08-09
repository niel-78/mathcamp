import { createContext, useContext, useEffect, useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

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

                console.log("AUTH USER", data);

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

    const logout = async () => {

        try {

            await fetch(
                `${API_URL}/api/auth/logout`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

        } catch (error) {

            console.error(error);

        }

        localStorage.removeItem("token");

        setUser(null);

    };


    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
    }

    export function useAuth() {
    return useContext(AuthContext);
}
