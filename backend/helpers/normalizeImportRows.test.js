import test from "node:test";
import assert from "node:assert/strict";

import { normalizeImportRows } from "./normalizeImportRows.js";

test("normalizes single_choice rows into question and option batches", () => {
    const rows = [
        {
            Fråga: "Vilket tal är 5?",
            Frågetyp: "single_choice",
            Nivå: 1,
            "Korrekta alternativ": "2",
            "Alternativ 1": "3",
            "Alternativ 2": "5",
            "Alternativ 3": "7"
        }
    ];

    const result = normalizeImportRows({
        rows,
        blockId: 10,
        userId: 99,
        abilityLevels: [{ id: 1 }, { id: 2 }, { id: 3 }]
    });

    assert.equal(result.questions.length, 1);
    assert.equal(result.questions[0].blockId, 10);
    assert.equal(result.questions[0].seriesLevelId, 1);
    assert.equal(result.questions[0].options.length, 3);
    assert.deepEqual(
        result.questions[0].options.map(option => [option.text, option.isCorrect]),
        [["3", 0], ["5", 1], ["7", 0]]
    );
});

test("normalizes multiple_choice and numeric_input rows", () => {
    const rows = [
        {
            Fråga: "Välj rätta svar",
            Frågetyp: "multiple_choice",
            Nivå: 2,
            "Korrekta alternativ": "2,4",
            "Alternativ 1": "A",
            "Alternativ 2": "B",
            "Alternativ 3": "C",
            "Alternativ 4": "D"
        },
        {
            Fråga: "Lös x = 3",
            Frågetyp: "numeric_input",
            Nivå: 1,
            "Korrekta alternativ": "3"
        }
    ];

    const result = normalizeImportRows({
        rows,
        blockId: 20,
        userId: 88,
        abilityLevels: [{ id: 2 }, { id: 3 }, { id: 4 }]
    });

    assert.equal(result.questions.length, 2);
    assert.equal(result.questions[0].options.length, 4);
    assert.equal(result.questions[1].options.length, 1);
    assert.ok(result.questions[0].options.some(option => option.text === "B" && option.isCorrect === 1));
    assert.ok(result.questions[0].options.some(option => option.text === "D" && option.isCorrect === 1));
    assert.ok(result.questions[1].options.some(option => option.text === "3" && option.isCorrect === 1));
});
