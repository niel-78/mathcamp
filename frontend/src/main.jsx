import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@/globals.css";
import 'katex/dist/katex.min.css';
import { AuthProvider } from "@/contexts/AuthContext"
import { AppSettingsProvider } from "@/contexts/AppSettingsContext"
import { SchoolSettingsProvider } from "@/contexts/SchoolSettingsContext"
import App from '@/App.jsx'

createRoot(
    document.getElementById("root")
).render(

    <StrictMode>

        <AppSettingsProvider>

            <AuthProvider>

                <SchoolSettingsProvider>

                    <App />

                </SchoolSettingsProvider>

            </AuthProvider>

        </AppSettingsProvider>

    </StrictMode>

);