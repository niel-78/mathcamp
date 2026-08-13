import { useState } from "react";
import WeekView from "./WeekView";
import CompactWeekView from "./CompactWeekView";
import ListView from "./ListView";
import { getCurrentWeek } from "@/utils/planningDates";
import { Button } from "@/components/ui/button";

export default function PlanningBoard({
    lessons = [],
    loading = false,
    onReload
}) {

    const [viewMode, setViewMode] = useState("week");
    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

    return (

        <div className="space-y-4">

            <div className="flex gap-2">

                <Button
                    variant="outline"
                    onClick={() =>
                        setSelectedWeek(
                            prev => prev - 1
                        )
                    }
                >
                    ◀
                </Button>

                <Button
                    variant="outline"
                    onClick={() =>
                        setSelectedWeek(
                            getCurrentWeek()
                        )
                    }
                >
                    Vecka {selectedWeek}
                </Button>

                <Button
                    variant="outline"
                    onClick={() =>
                        setSelectedWeek(
                            prev => prev + 1
                        )
                    }
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