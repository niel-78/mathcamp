import assert from "node:assert/strict";
import test from "node:test";

import {
    formatEventDuration,
    normalizeExamEvents,
    summarizeExamAbsences,
    summarizeSuspiciousExamBehavior
} from "./normalizeExamEvents.js";

test("collapses overlapping visibility and focus events", () => {
    const events = [
        { id: 4, event_type: "window_focus", created_at: "2026-09-18T07:20:15Z" },
        { id: 3, event_type: "tab_visible", created_at: "2026-09-18T07:20:14Z" },
        { id: 2, event_type: "window_blur", created_at: "2026-09-18T07:20:01Z" },
        { id: 1, event_type: "tab_hidden", created_at: "2026-09-18T07:20:00Z" }
    ];

    assert.deepEqual(normalizeExamEvents(events), [
        {
            id: 1,
            event_type: "exam_left",
            created_at: "2026-09-18T07:20:00Z",
            returned_at: "2026-09-18T07:20:14Z",
            duration_seconds: 14
        }
    ]);
});

test("keeps unrelated events and marks an open absence", () => {
    const events = [
        { id: 1, event_type: "question_view", created_at: "2026-09-18T07:19:00Z" },
        { id: 2, event_type: "window_blur", created_at: "2026-09-18T07:20:00Z" }
    ];

    assert.deepEqual(
        normalizeExamEvents(events).map(event => event.event_type),
        ["exam_left", "question_view"]
    );
    assert.equal(normalizeExamEvents(events)[0].duration_seconds, null);
});

test("formats event durations", () => {
    assert.equal(formatEventDuration(14), "14 sek");
    assert.equal(formatEventDuration(60), "1 min");
    assert.equal(formatEventDuration(75), "1 min 15 sek");
    assert.equal(formatEventDuration(null), "pågår");
});

test("summarizes completed and ongoing absences", () => {
    assert.deepEqual(summarizeExamAbsences([
        { event_type: "exam_left", duration_seconds: 14 },
        { event_type: "question_view" },
        { event_type: "exam_left", duration_seconds: 75 },
        { event_type: "exam_left", duration_seconds: null }
    ]), {
        count: 3,
        total_seconds: 89,
        longest_seconds: 75,
        has_ongoing: true
    });
});

test("flags suspicious behavior only after the threshold", () => {
    assert.equal(summarizeSuspiciousExamBehavior([
        { event_type: "exam_left", duration_seconds: 2 }
    ]).suspicious, false);

    assert.deepEqual(summarizeSuspiciousExamBehavior([
        { event_type: "question_view" },
        { event_type: "context_menu" },
        { event_type: "page_refresh" },
        { event_type: "page_unload" }
    ]), {
        suspicious: false,
        violation_count: 3,
        absence_count: 0,
        total_absence_seconds: 0,
        longest_absence_seconds: 0,
        context_menu_count: 1,
        page_refresh_count: 1,
        page_unload_count: 1,
        lock_count: 0
    });

    assert.equal(summarizeSuspiciousExamBehavior([
        { event_type: "question_view" }
    ]).suspicious, false);

    assert.equal(summarizeSuspiciousExamBehavior([
        { event_type: "exam_left", duration_seconds: 30 }
    ]).suspicious, true);

    assert.equal(summarizeSuspiciousExamBehavior([
        { event_type: "attempt_locked" }
    ]).suspicious, false);

    assert.equal(summarizeSuspiciousExamBehavior([
        { event_type: "context_menu" },
        { event_type: "context_menu" },
        { event_type: "context_menu" }
    ]).suspicious, false);

    assert.equal(summarizeSuspiciousExamBehavior([
        { event_type: "exam_left", duration_seconds: 20 },
        { event_type: "exam_left", duration_seconds: 20 }
    ]).suspicious, false);
});