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
            "Miniräknare tillåten": "Ja",
            "GeoGebra tillåten": "Ja",
            "Bild (URL)": "https://example.com/triangle.png",
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
    assert.equal(result.questions[0].calculatorAllowed, true);
    assert.equal(result.questions[0].geogebraAllowed, true);
    assert.equal(result.questions[0].imageUrl, "https://example.com/triangle.png");
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
            "Miniräknare tillåten": "true",
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
    assert.equal(result.questions[0].calculatorAllowed, true);
    assert.equal(result.questions[1].options.length, 1);
    assert.ok(result.questions[0].options.some(option => option.text === "B" && option.isCorrect === 1));
    assert.ok(result.questions[0].options.some(option => option.text === "D" && option.isCorrect === 1));
    assert.ok(result.questions[1].options.some(option => option.text === "3" && option.isCorrect === 1));
});

test("preserves decimal commas in numeric input answers", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "Svara med ett tal: {{input}}",
                Frågetyp: "numeric_input",
                Nivå: 1,
                "Korrekta alternativ": "2,5"
            },
            {
                Fråga: "Rötter: x_1 = {{input}} och x_2 = {{input}}",
                Frågetyp: "numeric_input",
                Nivå: 1,
                "Korrekta alternativ": "-2; 2",
                "Ordning spelar ingen roll": "Ja"
            }
        ],
        blockId: 30,
        userId: 77
    });

    assert.deepEqual(
        result.questions[0].options.map(option => option.text),
        ["2,5"]
    );
    assert.deepEqual(
        result.questions[1].options.map(option => option.text),
        ["-2", "2"]
    );
    assert.equal(
        result.questions[1].answerConfig.order_independent,
        true
    );
});

test("accepts Svar as the answer key column for numeric input rows", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "Bestäm ekvationen y=kx+m. Svar: {{input}}",
                Frågetyp: "numeric_input",
                Nivå: 1,
                Svar: "y=4x-7",
                "Miniräknare tillåten": "Ja"
            }
        ],
        blockId: 40,
        userId: 66
    });

    assert.equal(result.questions.length, 1);
    assert.deepEqual(
        result.questions[0].options.map(option => [option.text, option.isCorrect]),
        [["y=4x-7", 1]]
    );
    assert.equal(result.questions[0].answerConfig.default_answer, "y=4x-7");
    assert.equal(result.questions[0].calculatorAllowed, true);
});

test("accepts zero as an equation answer", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "$x + 4 = 4$",
                Frågetyp: "equation",
                Nivå: 2,
                Svar: 0
            }
        ],
        blockId: 42,
        userId: 66
    });

    assert.equal(result.questions[0].answerConfig.default_answer, "0");
    assert.deepEqual(
        result.questions[0].options.map(option => [option.text, option.isCorrect]),
        [["0", 1]]
    );
});

test("normalizes equation rows as dynamic unordered numeric answers", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "Lös x^2 = 25",
                Frågetyp: "equation",
                Nivå: 1,
                Svar: "-5; 5"
            }
        ],
        blockId: 45,
        userId: 66
    });

    assert.equal(result.questions[0].questionType, "equation");
    assert.equal(result.questions[0].answerConfig.order_independent, true);
    assert.deepEqual(
        result.questions[0].options.map(option => option.text),
        ["-5", "5"]
    );
});

test("stores Svar as a correct option for text rows", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "Bestäm ekvationen y=kx+m. Svar: {{input}}",
                Nivå: 1,
                Svar: "y=4x-7"
            }
        ],
        blockId: 50,
        userId: 66
    });

    assert.equal(result.questions[0].questionType, "text");
    assert.deepEqual(
        result.questions[0].options.map(option => [option.text, option.isCorrect]),
        [["y=4x-7", 1]]
    );
});

test("preserves decimal commas in text answer keys", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "Förenkla: $2x+0,5-0,9x+0,1$",
                Frågetyp: "text",
                Nivå: 2,
                Svar: "$1,1x+0,6$"
            }
        ],
        blockId: 52,
        userId: 66
    });

    assert.deepEqual(
        result.questions[0].options.map(option => [option.text, option.isCorrect]),
        [["$1,1x+0,6$", 1]]
    );
});

test("infers numeric_input when imported text rows contain input markers and numeric answers", () => {
    const result = normalizeImportRows({
        rows: [
            {
                Fråga: "Beräkna lutningen. Svar: {{input}}",
                Nivå: 1,
                Svar: "4"
            }
        ],
        blockId: 55,
        userId: 66
    });

    assert.equal(result.questions[0].questionType, "numeric_input");
    assert.deepEqual(
        result.questions[0].options.map(option => [option.text, option.isCorrect]),
        [["4", 1]]
    );
});

test("rejects choice questions without a valid correct option", () => {
    const rows = [
        {
            Fråga: "Saknar korrekt svar",
            Frågetyp: "single_choice",
            Nivå: 1,
            "Alternativ 1": "A"
        },
        {
            Fråga: "Pekar utanför alternativen",
            Frågetyp: "multiple_choice",
            Nivå: 1,
            "Korrekta alternativ": "3",
            "Alternativ 1": "A",
            "Alternativ 2": "B"
        }
    ];

    assert.throws(
        () => normalizeImportRows({
            rows,
            blockId: 10,
            userId: 99
        }),
        /Rad 2: single_choice måste ha exakt ett korrekt alternativ\nRad 3: korrekt alternativ 3 saknas/
    );
});
