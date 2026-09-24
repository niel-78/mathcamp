import test from "node:test";
import assert from "node:assert/strict";
import { parse, simplify } from "mathjs";

import {
    factorizeExpression,
    normalizeFactorizationSource,
    scoreFactorization
} from "./factorization.js";

const equivalent = (studentAnswer, correctAnswer) =>
    simplify(
        `(${normalizeFactorizationSource(studentAnswer)}) - ` +
        `(${normalizeFactorizationSource(correctAnswer)})`
    ).toString() === "0";

const score = (studentAnswer, correctAnswer = "x^2(x-11)") =>
    scoreFactorization({
        studentAnswer,
        correctAnswer,
        parseExpression: parse,
        equivalent
    });

test("factors out the greatest monomial factor", () => {
    assert.equal(
        factorizeExpression("Faktorisera $x^3 - 11x^2$", parse),
        "x^2(x - 11)"
    );
});

test("accepts equivalent fully factored forms", () => {
    assert.equal(score("x^2(x-11)").pointsFraction, 1);
    assert.equal(score("(x-11)x^2").pointsFraction, 1);
});

test("awards half credit for partial factorization", () => {
    assert.equal(score("x(x^2-11x)").pointsFraction, 0.5);
});

test("awards no credit for an expanded or incorrect answer", () => {
    assert.equal(score("x^3-11x^2").pointsFraction, 0);
    assert.equal(score("x^2(x+11)").pointsFraction, 0);
});
