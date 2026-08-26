import dayjs from "dayjs";

export default function MonthView({
    lessons,
    events = [],
    showEvents,
    selectedDate
}) {
    console.log("MontView");
    console.log(events);
    const currentMonth =
        dayjs(selectedDate);

    const startOfMonth =
        currentMonth.startOf("month");

    const endOfMonth =
        currentMonth.endOf("month");

    const firstWeekday =
        startOfMonth.day() === 0
            ? 7
            : startOfMonth.day();

    const days = [];

    for (
        let i = 1;
        i < firstWeekday;
        i++
    ) {
        days.push(null);
    }

    let current =
        startOfMonth;

    while (
        current.isBefore(endOfMonth) ||
        current.isSame(endOfMonth, "day")
    ) {

        days.push(current);

        current =
            current.add(1, "day");
    }

    const lessonsByDate = {};

    for (const lesson of lessons) {

        const key =
            dayjs(
                lesson.starts_at
            ).format("YYYY-MM-DD");

        if (!lessonsByDate[key]) {
            lessonsByDate[key] = [];
        }

        lessonsByDate[key].push(
            lesson
        );
    }

    const eventsByDate = {};

    for (const event of events) {

        const key =
            dayjs(event.date)
                .format("YYYY-MM-DD");

        if (!eventsByDate[key]) {
            eventsByDate[key] = [];
        }

        eventsByDate[key].push(event);

    }

    return (

        <div className="space-y-2">

            <div
                className="
                    grid
                    grid-cols-7
                    gap-2
                    font-medium
                    text-center
                "
            >
                <div>Mån</div>
                <div>Tis</div>
                <div>Ons</div>
                <div>Tor</div>
                <div>Fre</div>
                <div>Lör</div>
                <div>Sön</div>
            </div>

            <div
                className="
                    grid
                    grid-cols-7
                    gap-2
                "
            >

                {days.map(
                    (day, index) => {

                        if (!day) {

                            return (
                                <div
                                    key={index}
                                    className="
                                        min-h-[140px]
                                    "
                                />
                            );

                        }

                        const dateKey =
                            day.format(
                                "YYYY-MM-DD"
                            );

                        const dayLessons =
                            lessonsByDate[
                                dateKey
                            ] || [];

                        const isToday =
                            day.isSame(
                                dayjs(),
                                "day"
                            );

                        const dayEvents =
                            eventsByDate[
                                dateKey
                            ] || [];

                        return (

                            <div
                                key={dateKey}
                                className="
                                    border
                                    rounded-lg
                                    bg-card
                                    min-h-[140px]
                                    p-2
                                "
                            >

                                <div
                                    className={`
                                        font-semibold
                                        mb-2
                                        inline-flex
                                        items-center
                                        justify-center
                                        w-8
                                        h-8
                                        rounded-full
                                        ${
                                            isToday
                                                ? "bg-primary text-primary-foreground"
                                                : ""
                                        }
                                    `}
                                >
                                    {day.date()}
                                </div>

                                <div className="space-y-1">

                                    {dayLessons.map(
                                        lesson => (

                                            <div
                                                key={
                                                    lesson.id
                                                }
                                                className="
                                                    text-xs
                                                    bg-blue-100
                                                    text-blue-900
                                                    rounded
                                                    px-2
                                                    py-1
                                                "
                                            >

                                                <div
                                                    key={lesson.id}
                                                    className="
                                                        text-xs
                                                        bg-blue-100
                                                        text-blue-900
                                                        rounded
                                                        px-2
                                                        py-1
                                                    "
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            justify-between
                                                            gap-2
                                                        "
                                                    >
                                                        <span>
                                                            {dayjs(lesson.starts_at).format("HH:mm")}
                                                            -
                                                            {dayjs(lesson.ends_at).format("HH:mm")}
                                                        </span>

                                                        <span
                                                            className="
                                                                truncate
                                                                font-medium
                                                            "
                                                        >
                                                            {lesson.group_name}
                                                        </span>
                                                    </div>
                                                    
                                                </div>

                                            </div>

                                        )
                                    )}

                                    {showEvents &&
                                        dayEvents.map(event => (

                                            <div
                                                key={`event-${event.id}`}
                                                className={`
                                                    text-xs
                                                    rounded
                                                    px-2
                                                    py-1
                                                    mt-1

                                                    ${
                                                        event.affects_lessons
                                                            ? `
                                                                bg-red-100
                                                                text-red-900
                                                            `
                                                            : `
                                                                bg-amber-100
                                                                text-amber-900
                                                            `
                                                    }
                                                `}
                                            >
                                                {event.title}
                                            </div>

                                        ))
                                    }

                                </div>

                            </div>

                        );

                    }
                )}

            </div>

        </div>

    );

}