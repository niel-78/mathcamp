import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { useAuth } from "@/contexts/AuthContext";

const SchoolSettingsContext =
    createContext();

export function SchoolSettingsProvider({
    children
}) {

    const [
        schoolSettings,
        setSchoolSettings
    ] = useState({});

    const { user } = useAuth();
    

    useEffect(() => {

        if (!user?.school) {

            setSchoolSettings({});

            return;

        }

        fetch(
            `${API_URL}/api/school-settings`,
            {
                headers: authHeaders()
            }
        )
            .then(res => res.json())
            .then(setSchoolSettings);

    }, [user]);


    return (

        <SchoolSettingsContext.Provider
            value={{
                schoolSettings,
                setSchoolSettings
            }}
        >

            {children}

        </SchoolSettingsContext.Provider>

    );

}

export function useSchoolSettings() {

    return useContext(
        SchoolSettingsContext
    );

}