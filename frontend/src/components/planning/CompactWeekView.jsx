import LessonCard from "./LessonCard";

import {
    getWeekNumber,
    getWeekdayIndex
} from "@/utils/planningDates";

const weekdays = [
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag"
];

export default function CompactWeekView({
    lessons,
    selectedWeek
}) {

    const weekLessons =
        lessons.filter(
            lesson =>
                getWeekNumber(
                    lesson.starts_at
                ) === selectedWeek
        );

    const visibleDays =
        weekdays.filter(
            (_, index) =>
                weekLessons.some(
                    lesson =>
                        getWeekdayIndex(
                            lesson.starts_at
                        ) === index
                )
        );

    return (

        <div className="space-y-4">

            <h2
                className="
                    text-xl
                    font-semibold
                "
            >
                Vecka {selectedWeek}
            </h2>

            <div
                className="
                    flex
                    gap-4
                    items-start
                    w-full
                "
            >

                {visibleDays.map(
                    weekday => {

                        const weekdayIndex =
                            weekdays.indexOf(
                                weekday
                            );

                        const dayLessons =
                            weekLessons.filter(
                                lesson =>
                                    getWeekdayIndex(
                                        lesson.starts_at
                                    ) === weekdayIndex
                            );

                        return (

                            <div
                                key={weekday}
                                className="
                                    flex-1
                                    min-w-0
                                    space-y-3
                                "
                            >

                                <div
                                    className="
                                        border-b
                                        pb-2
                                        text-center
                                        font-semibold
                                    "
                                >
                                    {weekday}
                                </div>

                                {dayLessons.map(
                                    lesson => (

                                        <LessonCard
                                            key={lesson.id}
                                            lesson={lesson}
                                        />

                                    )
                                )}

                            </div>

                        );

                    }
                )}

            </div>

        </div>

    );

}