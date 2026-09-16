import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Columns2, PanelLeft, BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Calculator from "@/components/ui/Calculator";
import Draggable from "react-draggable";

function formulaUrl(group) {
    const course = [group?.level_code, group?.level_name, group?.subject_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (/forts[aä]ttning\s*(niv[aå]\s*)?1|forts\s*(niv[aå]\s*)?1|matematik\s*3|ma\s*3|matmat0?3[bc]|\b3\s*[bc]\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-3bc-fortsattning-niva-1.pdf";
    }

    if (/forts[aä]ttning\s*(niv[aå]\s*)?2|forts\s*(niv[aå]\s*)?2|matematik\s*4|ma\s*4|matmat0?4|\b4\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-4-fortsattning-niva-2.pdf";
    }

    if (/matematik\s*2|ma\s*2|matmat0?2[abc]|\b2\s*[abc]\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-2abc-2021.pdf";
    }

    return "/formula-sheets/formelblad-matematik-1abc.pdf";
}

export default function AppHeader({
    splitView,
    setSplitView,
    onOpenSidebar,
    activeTab,
    groups = []
}) {


    const [darkMode, setDarkMode] =
        useState(() => {

            return (
                localStorage.getItem("theme")
                === "dark"
            );

        });

    const [formulaOpen, setFormulaOpen] = useState(false);
    const formulaRef = useRef(null);

    const group = groups.find(item => Number(item.id) === Number(activeTab?.groupId));

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
                relative z-[9998]
                min-h-14

                flex
                items-center
                justify-between
                gap-3

                px-3
                sm:px-4
                py-2

                bg-sidebar
                text-sidebar-foreground

                border-b
                border-border
            "
        >

            <div className="flex min-w-0 items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="teacher-sidebar-toggle"
                    onClick={onOpenSidebar}
                    aria-label="Öppna meny"
                >
                    <Menu className="h-4 w-4" />
                </Button>

                <h1 className="teacher-brand-title truncate text-sm font-semibold tracking-wide sm:text-base">
                    m a t h c a m p - o n e
                </h1>
            </div>

            <div className="teacher-header-actions">

                {group && (
                <Button
                    variant="outline"
                    onClick={() => setFormulaOpen(value => !value)}
                    className="whitespace-nowrap"
                >
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Formelblad</span>
                </Button>
                )}

                <Calculator
                    showCalculator={true}
                    showGeoGebra={true}
                    compactLabels={true}
                />

                <Button
                    variant="outline"
                    className="hidden md:inline-flex"
                    onClick={() =>
                        setSplitView(
                            v => !v
                        )
                    }
                >
                    {splitView
                        ? <Columns2/>
                        : <PanelLeft/>}
                </Button>

                <Button
                    variant="outline"
                    onClick={toggleTheme}
                    size="icon"
                    aria-label="Byt tema"
                >
                    {darkMode
                        ? <Sun className="h-4 w-4" />
                        : <Moon className="h-4 w-4" />}
                </Button>

            </div>

            {formulaOpen && group && (
                <Draggable handle=".teacher-formula-drag-handle" cancel=".teacher-formula-controls" nodeRef={formulaRef}>
                    <section
                        ref={formulaRef}
                        className="absolute left-4 top-14 z-[10001] w-[min(900px,calc(100vw-2rem))] rounded-lg border bg-background p-3 shadow-2xl"
                    >
                        <div className="teacher-formula-drag-handle mb-3 flex cursor-move items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                            <span className="text-sm font-medium">
                                Formelblad {group.level_code || group.level_name || "Matematik"}
                            </span>
                            <div className="teacher-formula-controls">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFormulaOpen(false)}
                                    aria-label="Stäng formelblad"
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                        <iframe
                            title="Formelblad"
                            src={formulaUrl(group)}
                            className="h-[min(75vh,700px)] w-full rounded border"
                        />
                    </section>
                </Draggable>
            )}

        </div>

    );

}