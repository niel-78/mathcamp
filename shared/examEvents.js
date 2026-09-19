const leaveEventTypes = new Set([
    "tab_hidden",
    "window_blur"
]);

const returnEventTypes = new Set([
    "tab_visible",
    "window_focus"
]);

const suspiciousAbsenceSecondsThreshold = 30;

const toTimestamp = event =>
    new Date(event.created_at).getTime();

export function normalizeExamEvents(events) {
    const sortedEvents = [...events].sort((first, second) =>
        toTimestamp(first) - toTimestamp(second) ||
        Number(first.id) - Number(second.id)
    );
    const normalizedEvents = [];
    let absenceStart = null;

    sortedEvents.forEach(event => {
        if (leaveEventTypes.has(event.event_type)) {
            absenceStart ??= event;
            return;
        }

        if (returnEventTypes.has(event.event_type)) {
            if (absenceStart) {
                normalizedEvents.push({
                    ...absenceStart,
                    event_type: "exam_left",
                    returned_at: event.created_at,
                    duration_seconds: Math.max(
                        0,
                        Math.round(
                            (toTimestamp(event) - toTimestamp(absenceStart)) /
                            1000
                        )
                    )
                });
                absenceStart = null;
            }

            return;
        }

        normalizedEvents.push(event);
    });

    if (absenceStart) {
        normalizedEvents.push({
            ...absenceStart,
            event_type: "exam_left",
            returned_at: null,
            duration_seconds: null
        });
    }

    return normalizedEvents.sort((first, second) =>
        toTimestamp(second) - toTimestamp(first) ||
        Number(second.id) - Number(first.id)
    );
}

export function formatEventDuration(durationSeconds) {
    if (durationSeconds == null) {
        return "pågår";
    }

    if (durationSeconds < 60) {
        return `${durationSeconds} sek`;
    }

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    return seconds
        ? `${minutes} min ${seconds} sek`
        : `${minutes} min`;
}

export function summarizeExamAbsences(events) {
    const absences = events.filter(event =>
        event.event_type === "exam_left"
    );
    const completedDurations = absences
        .map(event => event.duration_seconds)
        .filter(duration => duration != null);

    return {
        count: absences.length,
        total_seconds: completedDurations.reduce(
            (total, duration) => total + duration,
            0
        ),
        longest_seconds: completedDurations.length
            ? Math.max(...completedDurations)
            : 0,
        has_ongoing: absences.some(event =>
            event.duration_seconds == null
        )
    };
}

export function summarizeSuspiciousExamBehavior(events) {
    const absenceSummary = summarizeExamAbsences(events);
    const countEvents = eventType =>
        events.filter(event => event.event_type === eventType).length;
    const contextMenuCount = countEvents("context_menu");
    const pageRefreshCount = countEvents("page_refresh");
    const pageUnloadCount = countEvents("page_unload");
    const lockCount = countEvents("attempt_locked");
    const violationCount =
        absenceSummary.count +
        contextMenuCount +
        pageRefreshCount +
        pageUnloadCount;

    return {
        suspicious:
            absenceSummary.longest_seconds >=
            suspiciousAbsenceSecondsThreshold,
        violation_count: violationCount,
        absence_count: absenceSummary.count,
        total_absence_seconds: absenceSummary.total_seconds,
        longest_absence_seconds: absenceSummary.longest_seconds,
        context_menu_count: contextMenuCount,
        page_refresh_count: pageRefreshCount,
        page_unload_count: pageUnloadCount,
        lock_count: lockCount
    };
}