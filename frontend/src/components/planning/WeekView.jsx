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

export default function WeekView({
    lessons,
    openTab,
    selectedWeek,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson,
    readOnly = false,
}) {

    const weekLessons =
        lessons.filter(
            lesson =>
                getWeekNumber(
                    lesson.starts_at
                ) === selectedWeek
        );

    const getDateForWeekday = (
        weekNumber,
        weekdayIndex
    ) => {

        const year =
            new Date().getFullYear();

        const firstDay =
            new Date(year, 0, 1);

        const days =
            (weekNumber - 1) * 7;

        const monday =
            new Date(
                firstDay.setDate(
                    firstDay.getDate() +
                    days -
                    firstDay.getDay() +
                    1
                )
            );

        monday.setDate(
            monday.getDate() +
            weekdayIndex
        );

        return monday;

    };

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
                    overflow-x-auto
                "
            >

                <div
                    className="
                        flex
                        gap-4
                        items-start
                        w-full
                    "
                >

                    {weekdays.map(
                        (weekday, index) => {

                            const dayLessons =
                                weekLessons.filter(
                                    lesson =>
                                        getWeekdayIndex(
                                            lesson.starts_at
                                        ) === index
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
                                            sticky
                                            top-0
                                            z-10
                                            bg-background
                                            border-b
                                            pb-2
                                            text-center
                                        "
                                    >

                                        <div
                                            className="font-semibold"
                                        >
                                            {weekday}
                                        </div>

                                        <div
                                            className="
                                                text-sm
                                                text-muted-foreground
                                            "
                                        >
                                            {getDateForWeekday(
                                                selectedWeek,
                                                index
                                            ).toLocaleDateString(
                                                "sv-SE"
                                            )}
                                        </div>

                                    </div>

                                    {dayLessons.length === 0 && (

                                        <div
                                            className="
                                                rounded-lg
                                                border
                                                bg-muted/30
                                                p-4
                                                text-center
                                                text-sm
                                                text-muted-foreground
                                            "
                                        >
                                            Inga lektioner
                                        </div>

                                    )}

                                    {dayLessons.map(
                                        lesson => (

                                        <LessonCard
                                            key={lesson.id}
                                            openTab={openTab}
                                            lesson={lesson}
                                            readOnly={readOnly}
                                            onEditLesson={onEditLesson}
                                            onCancelLesson={onCancelLesson}
                                            onDeleteLesson={onDeleteLesson}
                                        />

                                        )
                                    )}

                                </div>

                            );

                        }
                    )}

                </div>

            </div>

        </div>

    );

}