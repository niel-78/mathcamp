import { useEffect, useState, useTransition } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import WeekView from "./WeekView";
import CompactWeekView from "./CompactWeekView";
import ListView from "./ListView";
import MonthView from "./MonthView";
import { Button } from "@/components/ui/button";
import {
    getWeekNumber
} from "@/utils/planningDates";

const EMPTY_EVENTS = [];

export default function PlanningBoard({
    groupId,
    openTab,
    lessons,
    events: initialEvents = EMPTY_EVENTS,
    loading,
    onReload,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson,
    startDiagnosticTest,
    readOnly = false,
    isPublic = false,
    hideCompletions = false
}) {


    const [viewMode, setViewMode] = useState("week");
    const [isViewPending, startViewTransition] = useTransition();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const selectedWeek = getWeekNumber(selectedDate);
    const [events, setEvents] = useState(EMPTY_EVENTS);
    const [lessonAssessments, setLessonAssessments] = useState({});
    const [showEvents] = useState(true);
    const visibleEvents = isPublic ? initialEvents : events;

    useEffect(() => {
        if (viewMode !== "month" || lessons.length === 0) {
            return;
        }

        const lessonIds = lessons.map(lesson => lesson.id).join(",");
        const endpoint = isPublic
            ? `${API_URL}/api/public/lessons/group-assessments?lessonIds=${lessonIds}`
            : `${API_URL}/api/lessons/group-assessments?lessonIds=${lessonIds}`;

        const loadLessonAssessments = async () => {
            const response = await fetch(
                endpoint,
                {
                    headers: isPublic ? {} : authHeaders()
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const assessmentsByLesson = {};

            for (const assessment of data) {
                if (!assessmentsByLesson[assessment.lesson_id]) {
                    assessmentsByLesson[assessment.lesson_id] = [];
                }

                assessmentsByLesson[assessment.lesson_id].push(assessment);
            }

            setLessonAssessments(assessmentsByLesson);
        };

        loadLessonAssessments();
    }, [isPublic, lessons, viewMode]);

    useEffect(() => {

        if (!groupId || isPublic) {
            return;
        }

        const loadEvents =
            async () => {

                const response =
                    await fetch(
                        `${API_URL}/api/group-schedules/groups/${groupId}/events`,
                        {
                            headers:
                                authHeaders()
                        }
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                setEvents(data.map(event => ({
                    ...event,
                    group_id: groupId
                })));

            };

        loadEvents();

    }, [groupId, isPublic]);

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

    useEffect(() => {

        const handleScheduleChanged =
            () => {

                onReload?.();

            };

        window.addEventListener(
            "group-schedule-changed",
            handleScheduleChanged
        );

        return () => {

            window.removeEventListener(
                "group-schedule-changed",
                handleScheduleChanged
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

        <div className="planning-board space-y-4">

            <div className="planning-board-period flex gap-2">

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

                <div className="planning-board-view-modes flex gap-2">

                    <Button
                        variant={
                            viewMode === "week"
                                ? "default"
                                : "outline"
                        }
                        aria-pressed={viewMode === "week"}
                        onClick={() =>
                            startViewTransition(() =>
                                setViewMode("week")
                            )
                        }
                    >
                        Vecka
                    </Button>

                    <Button
                        variant={
                            viewMode === "compact"
                                ? "default"
                                : "outline"
                        }
                        aria-pressed={viewMode === "compact"}
                        onClick={() =>
                            startViewTransition(() =>
                                setViewMode("compact")
                            )
                        }
                    >
                        Slim
                    </Button>

                    <Button
                        variant={
                            viewMode === "list"
                                ? "default"
                                : "outline"
                        }
                        aria-pressed={viewMode === "list"}
                        onClick={() =>
                            startViewTransition(() =>
                                setViewMode("list")
                            )
                        }
                    >
                        Lista
                    </Button>
                    <Button
                        variant={
                            viewMode === "month"
                                ? "default"
                                : "outline"
                        }
                        aria-pressed={viewMode === "month"}
                        onClick={() => setViewMode("month")}
                    >
                        Månad
                    </Button>

                </div>

            </div>

            {(loading || isViewPending) && (
                <div>
                    Laddar...
                </div>
            )}

            {viewMode === "week" && (
                <WeekView
                    lessons={lessons}
                    openTab={openTab}
                    events={visibleEvents}
                    showEvents={showEvents}
                    selectedWeek={selectedWeek}
                    onReload={onReload}
                    onEditLesson={onEditLesson}
                    onCancelLesson={onCancelLesson}
                    onDeleteLesson={onDeleteLesson}
                    startDiagnosticTest={startDiagnosticTest}
                    readOnly={readOnly}
                    isPublic={isPublic}
                    hideCompletions={hideCompletions}
                />
            )}

            {viewMode === "compact" && (
                <CompactWeekView
                    lessons={lessons}
                    events={visibleEvents}
                    showEvents={showEvents}
                    selectedWeek={selectedWeek}
                    openTab={openTab}
                    onReload={onReload}
                    onEditLesson={onEditLesson}
                    onCancelLesson={onCancelLesson}
                    onDeleteLesson={onDeleteLesson}
                    startDiagnosticTest={startDiagnosticTest}
                    readOnly={readOnly}
                    isPublic={isPublic}
                    hideCompletions={hideCompletions}
                />
            )}

            {viewMode === "list" && (
                <ListView
                    lessons={lessons}
                    events={visibleEvents}
                    showEvents={showEvents}
                    openTab={openTab}
                    onReload={onReload}
                    onEditLesson={onEditLesson}
                    onCancelLesson={onCancelLesson}
                    onDeleteLesson={onDeleteLesson}
                    startDiagnosticTest={startDiagnosticTest}
                    readOnly={readOnly}
                    isPublic={isPublic}
                    hideCompletions={hideCompletions}
                />
            )}
            {viewMode === "month" && (
                <MonthView
                    lessons={lessons}
                    events={visibleEvents}
                    showEvents={showEvents}
                    selectedDate={selectedDate}
                    lessonAssessments={lessonAssessments}
                    readOnly={readOnly}
                />
            )}

        </div>

    );

}