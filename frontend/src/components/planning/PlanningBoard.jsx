import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import WeekView from "./WeekView";
import CompactWeekView from "./CompactWeekView";
import ListView from "./ListView";
import MonthView from "./MonthView";
import { Button } from "@/components/ui/button";
import {
    getCurrentWeek,
    getWeekNumber
} from "@/utils/planningDates";

export default function PlanningBoard({
    groupId,
    lessons,
    loading,
    onReload,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson
}) {  


    const [viewMode, setViewMode] = useState("week");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const selectedWeek = getWeekNumber(selectedDate);
    const [events, setEvents] = useState([]);
    const [showEvents, setShowEvents] = useState(true);

    useEffect(() => {

        const loadEvents =
            async () => {

                console.log(
                    "Laddar events för grupp",
                    groupId
                );

                const response =
                    await fetch(
                        `${API_URL}/api/group-schedules/groups/${groupId}/events`,
                        {
                            headers:
                                authHeaders()
                        }
                    );

                console.log(
                    "Status:",
                    response.status
                );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                console.log(
                    "Events från API:",
                    data
                );

                setEvents(data);

            };

        loadEvents();

    }, [groupId]);

    useEffect(() => {

        const handleScheduleCreated = () => {

            onReload?.();

        };

        window.addEventListener(
            "group-schedule-created",
            handleScheduleCreated
        );

        return () => {

            window.removeEventListener(
                "group-schedule-created",
                handleScheduleCreated
            );

        };

    }, [onReload]);

    const previousPeriod = () => {

        setSelectedDate(prev => {

            const date =
                new Date(prev);

            if (
                viewMode === "month"
            ) {

                date.setMonth(
                    date.getMonth() - 1
                );

            } else {

                date.setDate(
                    date.getDate() - 7
                );

            }

            return date;

        });

    };

    const nextPeriod = () => {

        setSelectedDate(prev => {

            const date =
                new Date(prev);

            if (
                viewMode === "month"
            ) {

                date.setMonth(
                    date.getMonth() + 1
                );

            } else {

                date.setDate(
                    date.getDate() + 7
                );

            }

            return date;

        });

    };

    return (

        <div className="space-y-4">

            <div className="flex gap-2">

                <Button
                    variant="outline"
                    onClick={previousPeriod}
                >
                    ◀
                </Button>

                <Button
                    variant="outline"
                    onClick={() =>
                        setSelectedDate(
                            new Date()
                        )
                    }
                >
                    {
                        viewMode === "month"
                            ? selectedDate.toLocaleDateString(
                                "sv-SE",
                                {
                                    month: "long",
                                    year: "numeric"
                                }
                            )
                            : `Vecka ${selectedWeek}`
                    }
                </Button>

                <Button
                    variant="outline"
                    onClick={nextPeriod}
                >
                    ▶
                </Button>

            </div>

            <div
                className="
                    flex
                    items-center
                    justify-between
                "
            >

                <div className="flex gap-2">

                    <Button
                        onClick={() =>
                            setViewMode("week")
                        }
                    >
                        Vecka
                    </Button>

                    <Button
                        onClick={() =>
                            setViewMode("compact")
                        }
                    >
                        Slim
                    </Button>

                    <Button
                        onClick={() =>
                            setViewMode("list")
                        }
                    >
                        Lista
                    </Button>
                    <Button
                        onClick={() =>
                            setViewMode("month")
                        }
                    >
                        Månad
                    </Button>

                </div>

            </div>

            {loading && (
                <div>
                    Laddar...
                </div>
            )}

            {viewMode === "week" && (
                <WeekView
                    lessons={lessons}
                    events={events}
                    showEvents={showEvents}
                    selectedWeek={selectedWeek}
                    onReload={onReload}
                    onEditLesson={onEditLesson}
                    onCancelLesson={onCancelLesson}
                    onDeleteLesson={onDeleteLesson}
                />
            )}

            {viewMode === "compact" && (
                <CompactWeekView
                    lessons={lessons}
                    events={events}
                    showEvents={showEvents}
                    selectedWeek={selectedWeek}
                    onReload={onReload}
                />
            )}

            {viewMode === "list" && (
                <ListView
                    lessons={lessons}
                    events={events}
                    showEvents={showEvents}
                    onReload={onReload}
                />
            )}
            {viewMode === "month" && (
                <MonthView
                    lessons={lessons}
                    events={events}
                    showEvents={showEvents}
                    selectedDate={selectedDate}
                />
            )}

        </div>

    );

}