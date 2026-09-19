import test from "node:test";
import assert from "node:assert/strict";

import { serializeAuthUser } from "./authUser.js";

test("serializeAuthUser includes email from the current user record", () => {
    const user = {
        id: 42,
        username: "alice",
        first_name: "Alice",
        last_name: "Andersson",
        role: "teacher",
        email: "alice@example.com"
    };

    assert.deepEqual(serializeAuthUser(user), {
        id: 42,
        username: "alice",
        first_name: "Alice",
        last_name: "Andersson",
        role: "teacher",
        email: "alice@example.com",
        school: null
    });
});

test("serializeAuthUser falls back to delivery_email when email is empty", () => {
    const user = {
        id: 7,
        username: "student1",
        first_name: "Student",
        last_name: "One",
        role: "student",
        email: "",
        delivery_email: "student1@elev.ga.dbgy.se"
    };

    assert.equal(serializeAuthUser(user).email, "student1@elev.ga.dbgy.se");
});
