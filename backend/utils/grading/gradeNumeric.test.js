import assert from "node:assert/strict";
import test from "node:test";

import { compareNumeric } from "./gradeNumeric.js";

test("accepts x = 3 as the answer 3 for equation questions", () => {
    assert.equal(
        compareNumeric("x = 3", "3", { grading_mode: "equation" }),
        true
    );
});

test("accepts x = 3 as a numeric answer even without an explicit grading_mode", () => {
    assert.equal(compareNumeric("x = 3", "3"), true);
});

test("does not treat x = 3 as a plain numeric answer when the numeric value differs", () => {
    assert.equal(compareNumeric("x = 3", "4"), false);
});