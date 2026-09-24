import assert from "node:assert/strict";
import test from "node:test";

import { parseDatabaseDate } from "./parseDatabaseDate.js";

test("parses zone-less database timestamps as local time", () => {
    const date = parseDatabaseDate("2026-09-19 12:00:00");

    assert.equal(date.getHours(), 12);
    assert.equal(date.getMinutes(), 0);
});

test("preserves timestamps that already specify a timezone", () => {
    assert.equal(
        parseDatabaseDate("2026-09-19T12:00:00+02:00").toISOString(),
        "2026-09-19T10:00:00.000Z"
    );
});