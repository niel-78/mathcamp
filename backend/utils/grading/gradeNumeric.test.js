import assert from "node:assert/strict";
import test from "node:test";

import { compareNumeric } from "./gradeNumeric.js";

test("accepts x = 3 as the answer 3 for equation questions", () => {
    assert.equal(
        compareNumeric("x = 3", "3", { grading_mode: "equation" }),
        true
    );
});

test("does not treat x = 3 as a plain numeric answer", () => {
    assert.equal(compareNumeric("x = 3", "3"), false);
});