import assert from "node:assert/strict";
import test from "node:test";

import { parseDatabaseDate } from "./parseDatabaseDate.js";

test("parses zone-less database timestamps as UTC", () => {
    const date = parseDatabaseDate("2026-09-19 12:00:00");

    assert.equal(date.toISOString(), "2026-09-19T12:00:00.000Z");
    assert.equal(date.toLocaleTimeString("sv-SE", {
        timeZone: "Europe/Stockholm",
        hour: "2-digit",
        minute: "2-digit"
    }), "14:00");
});

test("preserves timestamps that already specify a timezone", () => {
    assert.equal(
        parseDatabaseDate("2026-09-19T12:00:00+02:00").toISOString(),
        "2026-09-19T10:00:00.000Z"
    );
});