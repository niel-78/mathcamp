import test from "node:test";
import assert from "node:assert/strict";

import { resolveGroupAssessmentLifecycleState } from "./groupAssessmentState.js";

test("opening a group assessment opens the waiting room too", () => {
    assert.deepEqual(resolveGroupAssessmentLifecycleState("open"), {
        status: "open",
        waiting_room_open: 1,
    });
});

test("closing a group assessment closes the waiting room too", () => {
    assert.deepEqual(resolveGroupAssessmentLifecycleState("close"), {
        status: "closed",
        waiting_room_open: 0,
    });
});
