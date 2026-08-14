import { useState } from "react";
import WeekView from "./WeekView";
import CompactWeekView from "./CompactWeekView";
import ListView from "./ListView";
import { Button } from "@/components/ui/button";
import {
    getCurrentWeek,
    getWeekNumber
} from "@/utils/planningDates";

export default function PlanningBoard({
    lessons,
    loading,
    onReload,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson
}) {  


    const [viewMode, setViewMode] = useState("week");
    const [selectedDate, setSelectedDate] =
        useState(new Date());

    const selectedWeek =
        getWeekNumber(selectedDate);

    const previousWeek = () => {

        setSelectedDate(prev => {

            const date =
                new Date(prev);

            date.setDate(
                date.getDate() - 7
            );

            return date;

        });

    };

    const nextWeek = () => {

        setSelectedDate(prev => {

            const date =
                new Date(prev);

            date.setDate(
                date.getDate() + 7
            );

            return date;

        });

    };

    return (

        <div className="space-y-4">

            <div className="flex gap-2">

                <Button
                    variant="outline"
                    onClick={previousWeek}
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
                    Vecka {selectedWeek}
                </Button>

                <Button
                    variant="outline"
                    onClick={nextWeek}
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
                    selectedWeek={selectedWeek}
                    onReload={onReload}
                />
            )}

            {viewMode === "list" && (
                <ListView
                    lessons={lessons}
                    onReload={onReload}
                />
            )}

        </div>

    );

}