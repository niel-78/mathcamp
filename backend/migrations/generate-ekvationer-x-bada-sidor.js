import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/ekvationer_x_bada_sidor_2_nivaer.csv",
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

function formatAnswer(value) {
    const reduced = frac(value.n, value.d);
    if (reduced.d === 1) return String(reduced.n);
    if (reduced.d === 2) return String(reduced.n / 2).replace(".", ",");
    return `\\frac{${reduced.n}}{${reduced.d}}`;
}

function formatNumber(value) {
    const reduced = frac(value.n, value.d);
    if (reduced.d === 1) return String(reduced.n);
    return `\\frac{${reduced.n}}{${reduced.d}}`;
}

function signedNumber(value) {
    const reduced = frac(value.n, value.d);
    return reduced.n < 0
        ? ` - ${formatNumber(frac(-reduced.n, reduced.d))}`
        : ` + ${formatNumber(reduced)}`;
}

function coefficientTerm(coefficient) {
    const value = frac(coefficient.n, coefficient.d);
    if (value.n === 0) return "0";
    if (value.n === 1 && value.d === 1) return "x";
    if (value.n === -1 && value.d === 1) return "-x";
    return `${formatNumber(value)}x`;
}

function solveLinear(leftA, leftB, rightA, rightB) {
    return div(sub(rightB, leftB), sub(leftA, rightA));
}

function evaluate(a, b, x) {
    return add(mul(a, x), b);
}

const questions = [];

for (let index = 0; index < 25; index++) {
    const answer = frac((index % 31) - 10);
    const leftA = frac((index % 5) + 2);
    const rightMagnitude = leftA.n === 1 ? 2 : 1;
    const rightA = index % 2 === 0
        ? frac(rightMagnitude)
        : frac(-rightMagnitude);
    const leftB = frac((index * 3 % 15) - 7);
    const rightB = add(leftB, mul(sub(leftA, rightA), answer));
    const solution = solveLinear(leftA, leftB, rightA, rightB);

    questions.push({
        level: 1,
        equation: `${coefficientTerm(leftA)}${signedNumber(leftB)} = ${coefficientTerm(rightA)}${signedNumber(rightB)}`,
        answer: formatAnswer(solution),
        validate: () =>
            solution.d === 1 &&
            solution.n >= -10 &&
            solution.n <= 20 &&
            same(evaluate(leftA, leftB, solution), evaluate(rightA, rightB, solution))
    });
}

for (let index = 0; index < 50; index++) {
    const answerNumerators = [-10, -7, -5, -3, -1, 0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const answer = frac(
        answerNumerators[index % answerNumerators.length],
        index % 3 === 0 ? 2 : 1
    );
    const outerLeft = frac((index % 4) + 1, index % 5 === 0 ? 2 : 1);
    const innerLeftA = frac((index % 3) + 1);
    const innerLeftB = frac((index * 2 % 9) - 4);
    const leftA = mul(outerLeft, innerLeftA);
    const leftB = mul(outerLeft, innerLeftB);
    let rightMagnitude = (index % 5) + 1;
    const rightDenominator = index % 4 === 0 ? 2 : 1;
    while (
        index % 2 === 0 &&
        frac(rightMagnitude, rightDenominator).n === leftA.n &&
        frac(rightMagnitude, rightDenominator).d === leftA.d
    ) {
        rightMagnitude++;
    }
    const rightA = frac(
        index % 2 === 0 ? rightMagnitude : -rightMagnitude,
        rightDenominator
    );
    const rightB = frac((index * 5 % 17) - 8);
    const balancingConstant = sub(
        evaluate(rightA, rightB, answer),
        evaluate(leftA, leftB, answer)
    );
    const finalLeftB = add(leftB, balancingConstant);
    const solution = solveLinear(leftA, finalLeftB, rightA, rightB);

    questions.push({
        level: 2,
        equation: `${formatNumber(outerLeft)}(${coefficientTerm(innerLeftA)}${signedNumber(innerLeftB)})${signedNumber(balancingConstant)} = ${coefficientTerm(rightA)}${signedNumber(rightB)}`,
        answer: formatAnswer(solution),
        validate: () =>
            solution.n === answer.n &&
            solution.d === answer.d &&
            same(evaluate(leftA, finalLeftB, solution), evaluate(rightA, rightB, solution))
    });
}

if (questions.length !== 75) {
    throw new Error(`Förväntade 75 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    if (!question.validate()) {
        throw new Error(`Ogiltig fråga: ${question.equation}`);
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
