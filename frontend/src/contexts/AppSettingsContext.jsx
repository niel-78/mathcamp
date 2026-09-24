import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { API_URL } from "@/config";

const AppSettingsContext =
    createContext();

export function AppSettingsProvider({
    children
}) {

    const [appSettings,
        setAppSettings] =
        useState({});

        useEffect(() => {

            fetch(
                `${API_URL}/api/app-settings`
            )
                .then(res => {

                    if (!res.ok) {
                        throw new Error(`Failed to load app settings (${res.status})`);
                    }

                    return res.json();

                })
                .then(data => {

                    const settings =
                        typeof data === "string"
                            ? JSON.parse(data)
                            : data;

                    setAppSettings(settings);

                })
                .catch(error => {
                    console.error("Failed to load app settings:", error);
                });

        }, []);

    return (

        <AppSettingsContext.Provider
            value={{
                appSettings,
                setAppSettings
            }}
        >

            {children}

        </AppSettingsContext.Provider>

    );

}

export function useAppSettings() {

    return useContext(
        AppSettingsContext
    );

}