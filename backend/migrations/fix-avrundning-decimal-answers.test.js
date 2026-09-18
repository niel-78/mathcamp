import assert from "node:assert/strict";
import test from "node:test";
import { calculateRoundedAnswer } from "./fix-avrundning-decimal-answers.js";

test("calculates Swedish rounding answers with decimal commas", () => {
    assert.equal(
        calculateRoundedAnswer("Avrunda $99,445$ till två decimaler. Svar: {{input}}"),
        "99,45"
    );
    assert.equal(
        calculateRoundedAnswer("Avrunda $5,995$ till hundradelar."),
        "6,00"
    );
    assert.equal(
        calculateRoundedAnswer("Avrunda 27 000 till närmaste tusental."),
        "27000"
    );
    assert.equal(
        calculateRoundedAnswer("Avrunda 0,123 till närmaste hundradel."),
        "0,12"
    );
    assert.equal(
        calculateRoundedAnswer("Avrunda $27 000 $till tusental."),
        "27000"
    );
});