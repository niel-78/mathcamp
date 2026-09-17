import test from "node:test";
import assert from "node:assert/strict";

import { getSavedShowQuestionInfo } from "./questionSettings.js";

test("default is hidden for student question info", () => {
    const storage = {
        getItem: () => null
    };

    assert.equal(getSavedShowQuestionInfo(storage), false);
});

test("explicit saved value is respected", () => {
    assert.equal(getSavedShowQuestionInfo({ getItem: () => "true" }), true);
    assert.equal(getSavedShowQuestionInfo({ getItem: () => "false" }), false);
});
