import assert from "node:assert/strict";
import test from "node:test";

import { gradeText } from "./gradeText.js";

test("accepts algebraic text answers without LaTex delimiters", () => {
    assert.equal(gradeText("4x - 5", "$4x - 5$"), true);
});

test("accepts algebraically equivalent term order", () => {
    assert.equal(gradeText("-5 + 4x", "$4x - 5$"), true);
});

test("keeps different algebraic text answers incorrect", () => {
    assert.equal(gradeText("4x - 4", "$4x - 5$"), false);
});