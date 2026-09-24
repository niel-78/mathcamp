import test from "node:test";
import assert from "node:assert/strict";

import { evaluateExpression, solveEquation } from "./autoFixQuestion.js";

test("solves an equation embedded in Swedish prompt text", () => {
    const roots = solveEquation("Lös ekvationern $x^2=16$");

    assert.deepEqual(
        roots?.map(root => root.toDisplay()),
        ["-4", "4"]
    );
});

test("formats coefficients beside variables without multiplication signs", () => {
    assert.equal(
        evaluateExpression("Förenkla $x^2(x - 11)$"),
        "x^3 - 11x^2"
    );
});