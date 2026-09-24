import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/ekvationer_parenteser_forenkling_2_nivaer.csv",
    import.meta.url
).pathname;

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) [a, b] = [b, a % b];
    return a || 1;
}

function frac(n, d = 1) {
    if (d === 0) throw new Error("Noll får inte vara nämnare");
    if (d < 0) { n = -n; d = -d; }
    const divisor = gcd(n, d);
    return { n: n / divisor, d: d / divisor };
}

function add(left, right) {
    return frac(left.n * right.d + right.n * left.d, left.d * right.d);
}

function sub(left, right) {
    return add(left, frac(-right.n, right.d));
}

function mul(left, right) {
    return frac(left.n * right.n, left.d * right.d);
}

function div(left, right) {
    return frac(left.n * right.d, left.d * right.n);
}

function same(left, right) {
    return left.n === right.n && left.d === right.d;
}

function signedNumber(value) {
    const reduced = frac(value.n, value.d);
    const absolute = frac(Math.abs(reduced.n), reduced.d);
    return reduced.n < 0 ? ` - ${formatNumber(absolute)}` : ` + ${formatNumber(absolute)}`;
}

function formatNumber(value) {
    const reduced = frac(value.n, value.d);
    if (reduced.d === 1) return String(reduced.n);
    return `\\frac{${reduced.n}}{${reduced.d}}`;
}

function formatAnswer(value) {
    const reduced = frac(value.n, value.d);
    if (reduced.d === 1) return String(reduced.n);
    if (reduced.d === 2) return String(reduced.n / 2).replace(".", ",");
    return `\\frac{${reduced.n}}{${reduced.d}}`;
}

function coefficientTerm(coefficient) {
    const value = frac(coefficient.n, coefficient.d);
    if (value.n === 1 && value.d === 1) return "x";
    if (value.n === -1 && value.d === 1) return "-x";
    return `${formatNumber(value)}x`;
}

function formatLinear(a, b) {
    const first = coefficientTerm(a);
    if (b.n === 0) return first;
    return `${first}${signedNumber(b)}`;
}

function evaluate(a, b, x) {
    return add(mul(a, x), b);
}

function solve(leftA, leftB, rightA, rightB) {
    return div(sub(rightB, leftB), sub(leftA, rightA));
}

const questions = [];

for (let index = 0; index < 25; index++) {
    const solution = frac((index % 21) - 10);
    const outerA = frac((index % 5) + 2);
    const innerA = frac((index % 3) + 1);
    const innerB = frac((index * 2 % 9) - 4);
    const expandedLeftA = add(outerA, mul(outerA, innerA));
    let rightA = frac((index % 4) + 1);
    while (rightA.n === expandedLeftA.n && rightA.d === expandedLeftA.d) {
        rightA = frac(rightA.n + 1);
    }
    const rightB = frac((index * 3 % 13) - 6);
    const leftA = outerA;
    const parenthesisA = innerA;
    const parenthesisB = innerB;
    const expandedA = expandedLeftA;
    const expandedBBase = mul(outerA, parenthesisB);
    const balancingB = sub(evaluate(rightA, rightB, solution), evaluate(expandedA, expandedBBase, solution));
    const expandedB = add(expandedBBase, balancingB);
    const found = solve(expandedA, expandedB, rightA, rightB);

    questions.push({
        level: 1,
        equation: `${coefficientTerm(leftA)} + ${formatNumber(outerA)}(${formatLinear(parenthesisA, parenthesisB)})${signedNumber(balancingB)} = ${formatLinear(rightA, rightB)}`,
        answer: formatAnswer(found),
        validate: () => found.d === 1 && same(found, solution) && same(evaluate(expandedA, expandedB, found), evaluate(rightA, rightB, found))
    });
}

for (let index = 0; index < 25; index++) {
    const numerator = [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15][index % 13];
    const solution = frac(numerator, 2);
    const outerA = frac((index % 4) + 2, index % 3 === 0 ? 2 : 1);
    const innerA = frac((index % 3) + 1);
    const innerB = frac((index * 2 % 9) - 4);
    const rightA = frac(-((index % 5) + 1), index % 4 === 0 ? 2 : 1);
    const rightB = frac((index * 5 % 17) - 8);
    const extraA = frac((index % 3) + 1);
    const expandedA = add(extraA, mul(outerA, innerA));
    const expandedBBase = mul(outerA, innerB);
    const balancingB = sub(evaluate(rightA, rightB, solution), evaluate(expandedA, expandedBBase, solution));
    const expandedB = add(expandedBBase, balancingB);
    const found = solve(expandedA, expandedB, rightA, rightB);

    questions.push({
        level: 2,
        equation: `${coefficientTerm(extraA)} + ${formatNumber(outerA)}(${formatLinear(innerA, innerB)})${signedNumber(balancingB)} = ${formatLinear(rightA, rightB)}`,
        answer: formatAnswer(found),
        validate: () => found.d !== 1 && same(found, solution) && same(evaluate(expandedA, expandedB, found), evaluate(rightA, rightB, found))
    });
}

if (questions.length !== 50) {
    throw new Error(`Förväntade 50 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    if (!question.validate()) {
        throw new Error(`Ogiltig ekvation: ${question.equation}`);
    }
}

const rows = questions.map(question => ({
    "Fråga": `Lös ekvationen $${question.equation}$.`,
    "Frågetyp": "equation",
    "Nivå": question.level,
    "Svar": question.answer,
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} ekvationer till ${outputPath}`);
