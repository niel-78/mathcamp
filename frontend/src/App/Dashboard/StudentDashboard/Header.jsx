import UserProfile from "@/components/ui/UserProfile";
import Calculator from "@/components/ui/Calculator";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import FormulaSheetButton from "@/components/ui/FormulaSheetButton";

export default function Header({ groups = [] }) {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

    useEffect(() => {
        localStorage.setItem("theme", darkMode ? "dark" : "light");

        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    return (
        <header className="relative z-[9998] flex min-h-16 min-w-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-2 sm:gap-4 sm:px-6 sm:py-0">
            <UserProfile />
            <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
                <FormulaSheetButton group={groups[0] || {}} />
                <Calculator showCalculator={true} showGeoGebra={true} />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDarkMode(prev => !prev)}
                    aria-label={darkMode ? "Slå av nattläge" : "Slå på nattläge"}
                    title={darkMode ? "Slå av nattläge" : "Slå på nattläge"}
                >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
            </div>
        </header>
    );
}
