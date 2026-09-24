import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/forenkla_parenteser_termer_2_nivaer.csv",
    import.meta.url
).pathname;

function addTerms(left, right) {
    const result = { ...left };
    for (const [key, value] of Object.entries(right)) {
        result[key] = (result[key] || 0) + value;
        if (result[key] === 0) delete result[key];
    }
    return result;
}

function scaleTerms(terms, factor) {
    return Object.fromEntries(
        Object.entries(terms)
            .map(([key, value]) => [key, value * factor])
            .filter(([, value]) => value !== 0)
    );
}

function formatTerm(coefficient, variable, first = false) {
    if (variable === "constant") {
        if (first) return String(coefficient);
        return coefficient < 0 ? ` - ${Math.abs(coefficient)}` : ` + ${coefficient}`;
    }

    const absolute = Math.abs(coefficient);
    const body = absolute === 1 ? variable : `${absolute}${variable}`;
    if (first) return coefficient < 0 ? `-${body}` : body;
    return coefficient < 0 ? ` - ${body}` : ` + ${body}`;
}

function formatExpression(terms) {
    const order = ["x", "y", "z", "a", "b", "c", "constant"];
    const entries = order
        .filter(key => terms[key])
        .map(key => [key, terms[key]]);

    if (entries.length === 0) return "0";

    return entries
        .map(([variable, coefficient], index) => formatTerm(coefficient, variable, index === 0))
        .join("");
}

function termObject(coefficient, variable) {
    return { [variable]: coefficient };
}

const questions = [];

const level1Templates = [
    ["plus", [2, "x"], [3, "x"], [4, "constant"]],
    ["minus", [5, "x"], [2, "x"], [-3, "constant"]],
    ["plus", [4, "a"], [-1, "a"], [2, "constant"]],
    ["minus", [3, "x"], [-2, "x"], [5, "constant"]],
    ["plus", [-2, "x"], [6, "x"], [-3, "constant"]],
    ["minus", [7, "a"], [4, "a"], [-2, "constant"]],
    ["plus", [5, "x"], [-3, "x"], [6, "constant"]],
    ["minus", [-4, "x"], [2, "x"], [3, "constant"]],
    ["plus", [2, "a"], [5, "a"], [-1, "constant"]],
    ["minus", [6, "x"], [-3, "x"], [-4, "constant"]],
    ["plus", [-5, "x"], [2, "x"], [7, "constant"]],
    ["minus", [4, "a"], [1, "a"], [5, "constant"]],
    ["plus", [8, "x"], [-6, "x"], [3, "constant"]],
    ["minus", [2, "x"], [5, "x"], [-3, "constant"]],
    ["plus", [3, "a"], [4, "a"], [2, "constant"]],
    ["minus", [-2, "x"], [-5, "x"], [4, "constant"]],
    ["plus", [6, "x"], [-1, "x"], [-5, "constant"]],
    ["minus", [9, "a"], [3, "a"], [-1, "constant"]],
    ["plus", [1, "x"], [2, "x"], [8, "constant"]],
    ["minus", [-6, "x"], [4, "x"], [-2, "constant"]],
    ["plus", [5, "a"], [3, "a"], [-4, "constant"]],
    ["minus", [7, "x"], [-2, "x"], [6, "constant"]],
    ["plus", [-3, "x"], [9, "x"], [1, "constant"]],
    ["minus", [2, "a"], [-4, "a"], [-5, "constant"]],
    ["plus", [4, "x"], [1, "x"], [-6, "constant"]]
];

for (const [kind, first, second, third] of level1Templates) {
    const firstTerms = termObject(first[0], first[1]);
    const secondTerms = termObject(second[0], second[1]);
    const thirdTerms = termObject(third[0], third[1]);
    const parenthesis = kind === "plus"
        ? addTerms(secondTerms, thirdTerms)
        : addTerms(secondTerms, scaleTerms(thirdTerms, -1));
    const answer = kind === "plus"
        ? addTerms(firstTerms, addTerms(secondTerms, thirdTerms))
        : addTerms(firstTerms, addTerms(scaleTerms(secondTerms, -1), thirdTerms));

    questions.push({
        level: 1,
        expression: `${formatExpression(firstTerms)} ${kind === "plus" ? "+" : "-"} (${formatExpression(parenthesis)})`,
        answer: formatExpression(answer),
        expectedTerms: 2
    });
}

const level2Templates = [
    ["plus", [[2, "x"], [3, "y"]], [[4, "x"], [5, "y"]]],
    ["minus", [[6, "x"], [2, "y"]], [[3, "x"], [4, "y"]]],
    ["plus", [[-2, "a"], [5, "b"]], [[3, "a"], [-4, "b"]]],
    ["minus", [[4, "x"], [-3, "y"]], [[-2, "x"], [6, "y"]]],
    ["plus", [[5, "x"], [1, "y"]], [[-3, "x"], [2, "y"]]],
    ["minus", [[7, "a"], [4, "b"]], [[2, "a"], [-5, "b"]]],
    ["plus", [[3, "x"], [-6, "y"]], [[8, "x"], [2, "y"]]],
    ["minus", [[-4, "x"], [5, "y"]], [[3, "x"], [-2, "y"]]],
    ["plus", [[6, "a"], [2, "b"]], [[-1, "a"], [4, "b"]]],
    ["minus", [[9, "x"], [-2, "y"]], [[4, "x"], [3, "y"]]],
    ["plus", [[1, "x"], [2, "y"]], [[3, "x"], [4, "y"]]],
    ["minus", [[5, "a"], [-3, "b"]], [[-2, "a"], [6, "b"]]],
    ["plus", [[-7, "x"], [4, "y"]], [[2, "x"], [-5, "y"]]],
    ["minus", [[3, "x"], [8, "y"]], [[-4, "x"], [2, "y"]]],
    ["plus", [[4, "a"], [-1, "b"]], [[5, "a"], [2, "b"]]],
    ["minus", [[-6, "x"], [3, "y"]], [[2, "x"], [-4, "y"]]],
    ["plus", [[7, "x"], [2, "y"]], [[-3, "x"], [4, "y"]]],
    ["minus", [[2, "a"], [5, "b"]], [[-3, "a"], [1, "b"]]],
    ["plus", [[-4, "x"], [6, "y"]], [[1, "x"], [-2, "y"]]],
    ["minus", [[8, "x"], [3, "y"]], [[5, "x"], [-6, "y"]]],
    ["plus", [[3, "a"], [4, "b"]], [[2, "a"], [5, "b"]]],
    ["minus", [[-5, "x"], [7, "y"]], [[3, "x"], [2, "y"]]],
    ["plus", [[6, "x"], [-2, "y"]], [[-1, "x"], [4, "y"]]],
    ["minus", [[1, "a"], [3, "b"]], [[-5, "a"], [2, "b"]]],
    ["plus", [[2, "x"], [3, "y"]], [[4, "x"], [5, "y"]]]
];

for (const [kind, outside, inside] of level2Templates) {
    const outsideTerms = outside.reduce(
        (result, [coefficient, variable]) => addTerms(result, termObject(coefficient, variable)),
        {}
    );
    const insideTerms = inside.reduce(
        (result, [coefficient, variable]) => addTerms(result, termObject(coefficient, variable)),
        {}
    );
    const answer = kind === "plus"
        ? addTerms(outsideTerms, insideTerms)
        : addTerms(outsideTerms, scaleTerms(insideTerms, -1));

    questions.push({
        level: 2,
        expression: `${formatExpression(outsideTerms)} ${kind === "plus" ? "+" : "-"} (${formatExpression(insideTerms)})`,
        answer: formatExpression(answer),
        expectedTerms: Object.keys(answer).length
    });
}

if (questions.length !== 50) {
    throw new Error(`Förväntade 50 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    const termCount = Object.keys(
        question.answer === "0"
            ? {}
            : question.answer.split(/ \+ | - /).reduce((result, _, index) => ({ ...result, [index]: true }), {})
    ).length;

    if (question.level === 2 && question.expectedTerms > 2) {
        throw new Error(`Nivå 2 får ha högst 2 variabler: ${question.expression}`);
    }

    if (termCount === 0 && question.answer !== "0") {
        throw new Error(`Tomt facit: ${question.expression}`);
    }
}

const rows = questions.map(question => ({
    "Fråga": `Förenkla: $${question.expression}$. Svar: {{input}}`,
    "Frågetyp": "text",
    "Nivå": question.level,
    "Svar": `$${question.answer}$`,
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} parentesförenklingar till ${outputPath}`);
