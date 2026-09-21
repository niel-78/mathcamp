import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { getGroupColor } from "@/utils/groupColors";

export default function MonthView({
    lessons,
    events = [],
    showEvents,
    selectedDate,
    lessonAssessments = {},
    onDeleteLesson,
    readOnly = false
}) {

    const weekdayLabels = ["Mån", "Tis", "Ons", "Tor", "Fre"];
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        if (!contextMenu) {
            return;
        }

        const closeContextMenu = () => setContextMenu(null);
        const closeOnEscape = event => {
            if (event.key === "Escape") {
                closeContextMenu();
            }
        };

        document.addEventListener("click", closeContextMenu);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener("click", closeContextMenu);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [contextMenu]);

    const { days, lessonsByDate, eventsByDate } = useMemo(() => {
        const currentMonth = dayjs(selectedDate);
        const startOfMonth = currentMonth.startOf("month");
        const endOfMonth = currentMonth.endOf("month");
        const firstWeekday =
            startOfMonth.day() === 0
                ? 7
                : startOfMonth.day();
        const monthDays = [];

        for (let i = 1; i < firstWeekday; i++) {
            monthDays.push(null);
        }

        let current = startOfMonth;

        while (
            current.isBefore(endOfMonth) ||
            current.isSame(endOfMonth, "day")
        ) {
            monthDays.push(current);
            current = current.add(1, "day");
        }

        const lessonIndex = {};

        for (const lesson of lessons) {
            const key = dayjs(lesson.starts_at).format("YYYY-MM-DD");

            if (!lessonIndex[key]) {
                lessonIndex[key] = [];
            }

            const existingLesson = lessonIndex[key].find(item => item.id === lesson.id);

            if (!existingLesson) {
                lessonIndex[key].push(lesson);
            }
        }

        const eventIndex = {};

        for (const event of events) {
            const key = dayjs(event.date).format("YYYY-MM-DD");

            if (!eventIndex[key]) {
                eventIndex[key] = [];
            }

            const existingEvent = eventIndex[key].find(item => item.id === event.id);

            if (!existingEvent) {
                eventIndex[key].push(event);
            }
        }

        return {
            days: monthDays,
            lessonsByDate: lessonIndex,
            eventsByDate: eventIndex
        };
    }, [events, lessons, selectedDate]);

    const openLessonContextMenu = (event, lesson) => {
        if (readOnly || !onDeleteLesson) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            lesson,
            x: event.clientX,
            y: event.clientY
        });
    };

    return (

        <div className="space-y-2">

            {contextMenu && createPortal(
                <div
                    className="fixed z-[100] min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y
                    }}
                    onClick={event => event.stopPropagation()}
                >
                    <button
                        type="button"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                        onClick={() => {
                            const lesson = contextMenu.lesson;
                            setContextMenu(null);
                            onDeleteLesson(lesson);
                        }}
                    >
                        Ta bort lektion
                    </button>
                </div>,
                document.body
            )}

            <div
                className="
                    grid
                    grid-cols-5
                    gap-2
                    font-medium
                    text-center
                "
            >
                {weekdayLabels.map(label => (
                    <div key={label}>{label}</div>
                ))}
            </div>

            <div
                className="
                    grid
                    grid-cols-5
                    gap-2
                "
            >

                {days.map(
                    (day, index) => {

                        if (day && (day.day() === 0 || day.day() === 6)) {
                            return null;
                        }

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
                                                key={lesson.id}
                                                onMouseDown={event => {
                                                    if (event.button === 2) {
                                                        openLessonContextMenu(event, lesson);
                                                    }
                                                }}
                                                onAuxClick={event => {
                                                    if (event.button === 2) {
                                                        openLessonContextMenu(event, lesson);
                                                    }
                                                }}
                                                onContextMenu={event =>
                                                    openLessonContextMenu(event, lesson)
                                                }
                                                className="
                                                    text-xs
                                                    bg-blue-100
                                                    text-blue-900
                                                    rounded
                                                    px-2
                                                    py-1
                                                "
                                                style={getGroupColor(lesson.group_id)
                                                    ? {
                                                        backgroundColor: getGroupColor(lesson.group_id).background,
                                                        color: getGroupColor(lesson.group_id).text,
                                                        borderLeft: `3px solid ${getGroupColor(lesson.group_id).border}`
                                                    }
                                                    : undefined}
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

                                                {lesson.sections?.length > 0 && (
                                                    <div className="mt-1 space-y-0.5 text-[11px] text-blue-800/80">
                                                        {lesson.sections.map(section => (
                                                            <div
                                                                key={`section-${lesson.id}-${section.id}`}
                                                                className="truncate"
                                                            >
                                                                <span>{section.title}</span>
                                                                {(section.page_number != null || section.end_page != null) && (
                                                                    <span className="ml-1 text-blue-800/60">
                                                                        ({section.page_number ?? "?"}
                                                                        -
                                                                        {section.end_page ?? section.page_number ?? "?"})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {lessonAssessments[lesson.id]?.map(assessment => (
                                                    <div
                                                        key={`assessment-${assessment.id}`}
                                                        className={assessment.type === "diagnostic"
                                                            ? "mt-1 truncate px-1 text-[11px] font-bold"
                                                            : "mt-1 truncate rounded bg-emerald-100 px-1 text-[11px] text-emerald-900"}
                                                    >
                                                        {assessment.type === "diagnostic"
                                                            ? "Diagnos"
                                                            : assessment.title || assessment.type}
                                                    </div>
                                                ))}
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

                                                    ${getGroupColor(event.group_id)
                                                        ? ""
                                                        : event.affects_lessons
                                                            ? "bg-red-100 text-red-900"
                                                            : "bg-amber-100 text-amber-900"
                                                    }
                                                `}
                                                style={getGroupColor(event.group_id)
                                                    ? {
                                                        backgroundColor: getGroupColor(event.group_id).background,
                                                        color: getGroupColor(event.group_id).text,
                                                        borderLeft: `3px solid ${getGroupColor(event.group_id).border}`
                                                    }
                                                    : undefined}
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