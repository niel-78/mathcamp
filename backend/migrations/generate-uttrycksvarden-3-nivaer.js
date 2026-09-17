import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/uttrycksvarden_3_nivaer_numeric_input.csv",
    import.meta.url
).pathname;

const questions = [];

for (let index = 0; index < 50; index++) {
    const x = (index % 5) + 1;
    const coefficient = (index % 2) + 2;
    const constant = (index % 11) - 5;
    const useSubtraction = index % 2 === 1;
    const value = useSubtraction
        ? constant - coefficient * x
        : coefficient * x + constant;
    const expression = useSubtraction
        ? `${constant} - ${coefficient}x`
        : `${coefficient}x ${constant < 0 ? "-" : "+"} ${Math.abs(constant)}`;

    questions.push({
        level: 1,
        question: `Bestäm värdet av $${expression}$ då $x=${x}$`,
        answer: value,
        validate: () => value >= -20 && value <= 20 && x > 0
    });
}

for (let index = 0; index < 50; index++) {
    const x = -((index % 5) + 1);
    const coefficient = (index % 2) + 2;
    const constant = (index % 11) - 5;
    const useSubtraction = index % 2 === 1;
    const value = useSubtraction
        ? constant - coefficient * x
        : coefficient * x + constant;
    const expression = useSubtraction
        ? `${constant} - ${coefficient}x`
        : `${coefficient}x ${constant < 0 ? "-" : "+"} ${Math.abs(constant)}`;

    questions.push({
        level: 2,
        question: `Bestäm värdet av $${expression}$ då $x=${x}$`,
        answer: value,
        validate: () => value >= -20 && value <= 20 && x < 0
    });
}

const variablePairs = [
    [-2, 2], [-3, -1], [-1, 4], [2, -3], [3, 2],
    [1, -4], [-4, 1], [2, 2], [-2, -2], [4, -1]
];

for (let index = 0; index < 50; index++) {
    const [a, b] = variablePairs[index % variablePairs.length];
    const template = index % 5;
    const expression = [
        "(ab)^2",
        "a^2 + b",
        "2a - b",
        "ab + a",
        "a + 2b"
    ][template];
    const value = [
        (a * b) ** 2,
        a ** 2 + b,
        2 * a - b,
        a * b + a,
        a + 2 * b
    ][template];

    questions.push({
        level: 3,
        question: `Bestäm värdet av $${expression}$ då $a=${a}$ och $b=${b}$`,
        answer: value,
        validate: () => value >= -20 && value <= 20
    });
}

if (questions.length !== 150) {
    throw new Error(`Förväntade 150 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    if (!Number.isInteger(question.answer) || !question.validate()) {
        throw new Error(`Ogiltig fråga eller facit: ${question.question}`);
    }
}

const rows = questions.map(question => ({
    "Fråga": `${question.question}. Svar: {{input}}`,
    "Frågetyp": "numeric_input",
    "Nivå": question.level,
    "Svar": String(question.answer),
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} uttrycksvärden till ${outputPath}`);