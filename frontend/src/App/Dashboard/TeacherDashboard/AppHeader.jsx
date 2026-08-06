import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader({
    splitView,
    setSplitView
}) {


    const [darkMode, setDarkMode] =
        useState(() => {

            return (
                localStorage.getItem("theme")
                === "dark"
            );

        });

    const toggleTheme = () => {

        setDarkMode(
            prev => !prev
        );

    };

    useEffect(() => {

        localStorage.setItem(
            "theme",
            darkMode
                ? "dark"
                : "light"
        );

        if (darkMode) {

            document.documentElement
                .classList.add("dark");

        } else {

            document.documentElement
                .classList.remove("dark");

        }

    }, [darkMode]);

    return (

        <div
            className="
                h-12
                flex
                items-center
                justify-between
                px-4
                border-b
            "
        >

            <h1>
                Exam Studio
            </h1>

            <div className="flex gap-2">

                <Button
                    variant="outline"
                    onClick={() =>
                        setSplitView(
                            v => !v
                        )
                    }
                >
                    {splitView
                        ? "En vy"
                        : "Delad vy"}
                </Button>

                <Button
                    variant="outline"
                    onClick={toggleTheme}
                >
                    {darkMode
                        ? <Sun />
                        : <Moon />}
                </Button>

            </div>

        </div>

    );

}