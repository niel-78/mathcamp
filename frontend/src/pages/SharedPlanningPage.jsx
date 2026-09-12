import { useEffect, useState, useCallback } from "react";
import PlanningBoard from "@/components/planning/PlanningBoard";
import { API_URL } from "@/config";
import { CalendarDays } from "lucide-react";

export default function SharedPlanningPage() {

    const shareId =
        window.location.pathname
            .split("/")
            .pop();

    const [loading, setLoading] =
        useState(true);

    const [group, setGroup] =
        useState(null);

    const [lessons, setLessons] =
        useState([]);

    const [events, setEvents] =
        useState([]);

    const load = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/public/planning/${shareId}`
            );

            if (!response.ok) {
                setLoading(false);
                return;
            }

            const data = await response.json();

            setGroup(data.group ?? null);
            setLessons(data.lessons ?? []);
            setEvents(data.events ?? []);
        } catch (err) {
            console.error("Kunde inte ladda delad planering:", err);
        } finally {
            setLoading(false);
        }
    }, [shareId]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="h-screen flex flex-col">
            <header className="h-16 border-b px-6 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 font-bold text-lg text-primary">
                    <CalendarDays className="h-5 w-5" />
                    <span>Planering</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <div className="w-full max-w-6xl mx-auto space-y-4">
                    {group?.name && (
                        <div className="flex items-center justify-end">
                            <div className="text-sm font-medium text-muted-foreground">
                                Grupp: <span className="font-semibold text-foreground">{group.name}</span>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold">
                            Gruppens planering
                        </h2>

                        <PlanningBoard
                            lessons={lessons}
                            events={events}
                            loading={loading}
                            onReload={load}
                            readOnly={true}
                            isPublic={true}
                            hideCompletions={true}
                        />
                    </div>
                </div>
            </main>
        </div>
    );

}