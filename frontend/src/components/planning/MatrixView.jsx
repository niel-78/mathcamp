import { useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import { getGroupColor } from "@/utils/groupColors";
import { parseDatabaseDate } from "@/utils/parseDatabaseDate";
import { getWeekNumber } from "@/utils/planningDates";
import LessonCard from "./LessonCard";

export default function MatrixView({
    lessons,
    events = [],
    showEvents,
    openTab,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson,
    startDiagnosticTest,
    readOnly = false,
    isPublic = false,
    hideCompletions = false
}) {
    const matrixRef = useRef(null);

    const days = useMemo(() => {
        const lessonDays = new Map();
        const eventDays = new Map();

        for (const lesson of lessons) {
            const date = dayjs(lesson.starts_at);

            const key = date.format("YYYY-MM-DD");
            const day = lessonDays.get(key) || {
                date,
                lessons: [],
                events: []
            };

            if (!day.lessons.some(item => item.id === lesson.id)) {
                day.lessons.push(lesson);
            }

            lessonDays.set(key, day);
        }

        for (const event of events) {
            const date = dayjs(event.date);

            const key = date.format("YYYY-MM-DD");
            eventDays.set(key, [...(eventDays.get(key) || []), event]);
        }

        for (const [key, day] of lessonDays) {
            day.events = eventDays.get(key) || [];
        }

        return [...lessonDays.values()].sort((a, b) =>
            a.date.valueOf() - b.date.valueOf()
        );
    }, [events, lessons]);

    const weeks = useMemo(() => {
        const weekGroups = new Map();

        for (const day of days) {
            const weekNumber = getWeekNumber(day.date.toDate());
            const key = `${day.date.year()}-${weekNumber}`;
            const week = weekGroups.get(key) || {
                key,
                weekNumber,
                days: []
            };

            week.days.push(day);
            weekGroups.set(key, week);
        }

        return [...weekGroups.values()];
    }, [days]);

    useEffect(() => {
        if (!matrixRef.current || days.length === 0) {
            return;
        }

        const completedLessons = days
            .flatMap(day => day.lessons)
            .filter(lesson =>
                lesson.ends_at && parseDatabaseDate(lesson.ends_at) < new Date()
            )
            .sort((a, b) =>
                parseDatabaseDate(a.ends_at) - parseDatabaseDate(b.ends_at)
            );
        const latestCompletedLesson = completedLessons.at(-1);

        if (!latestCompletedLesson) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            const latestCompletedDate = dayjs(latestCompletedLesson.starts_at)
                .format("YYYY-MM-DD");
            const target = matrixRef.current?.querySelector(
                `[data-matrix-date="${latestCompletedDate}"]`
            );

            target?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        return () => cancelAnimationFrame(frame);
    }, [days]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Matris</h2>

            {weeks.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    Inga lektioner.
                </div>
            ) : (
                <div ref={matrixRef} className="space-y-6">
                    {weeks.map(week => (
                        <div key={week.key} className="space-y-2">
                            <div className="text-sm font-semibold text-muted-foreground">
                                Vecka {week.weekNumber}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {week.days.map(day => (
                                    <section
                                        key={day.date.format("YYYY-MM-DD")}
                                        data-matrix-date={day.date.format("YYYY-MM-DD")}
                                        className="space-y-2"
                                    >
                                        {day.lessons.map(lesson => (
                                            <LessonCard
                                                key={lesson.id}
                                                lesson={lesson}
                                                openTab={openTab}
                                                onEditLesson={onEditLesson}
                                                onCancelLesson={onCancelLesson}
                                                onDeleteLesson={onDeleteLesson}
                                                startDiagnosticTest={startDiagnosticTest}
                                                readOnly={readOnly}
                                                isPublic={isPublic}
                                                hideCompletions={hideCompletions}
                                            />
                                        ))}

                                        {showEvents && day.events.map(event => (
                                            <div
                                                key={`event-${event.id}`}
                                                className={event.affects_lessons
                                                    ? "rounded px-2 py-1 text-xs"
                                                    : "rounded bg-amber-100 px-2 py-1 text-xs text-amber-900"}
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
                                        ))}
                                    </section>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
