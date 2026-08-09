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
                .then(res => res.json())
                .then(data => {

                    const settings =
                        typeof data === "string"
                            ? JSON.parse(data)
                            : data;

                    setAppSettings(settings);

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