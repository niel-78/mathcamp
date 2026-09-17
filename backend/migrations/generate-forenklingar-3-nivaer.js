import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/forenklingar_3_nivaer_text.csv",
    import.meta.url
).pathname;

function gcd(left, right) {
    let a = Math.abs(left);
    let b = Math.abs(right);

    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a || 1;
}

function formatDecimal(numerator, denominator = 10) {
    const sign = numerator < 0 ? "-" : "";
    const absolute = Math.abs(numerator);
    const whole = Math.floor(absolute / denominator);
    const remainder = absolute % denominator;

    if (remainder === 0) {
        return `${sign}${whole}`;
    }

    return `${sign}${whole},${String(remainder).padStart(1, "0")}`;
}

function formatTerm(coefficient, suffix, first, denominator = 1) {
    const absolute = Math.abs(coefficient);
    const value = denominator === 1
        ? String(absolute)
        : formatDecimal(absolute, denominator);
    const term = suffix && value === "1" ? suffix : `${value}${suffix}`;

    if (first) {
        return coefficient < 0 ? `-${term}` : term;
    }

    return coefficient < 0 ? ` - ${term}` : ` + ${term}`;
}

function formatLinear(coefficient, constant, denominator = 1) {
    let result = "";

    if (coefficient !== 0) {
        result = formatTerm(coefficient, "x", true, denominator);
    }

    if (constant !== 0 || !result) {
        result += formatTerm(constant, "", !result, denominator);
    }

    return result;
}

function formatFractionLinear(coefficient, constant, denominator) {
    const divisor = gcd(gcd(coefficient, constant), denominator);
    const reducedCoefficient = coefficient / divisor;
    const reducedConstant = constant / divisor;
    const reducedDenominator = denominator / divisor;

    if (reducedDenominator === 1) {
        return formatLinear(reducedCoefficient, reducedConstant);
    }

    const numerator = formatLinear(reducedCoefficient, reducedConstant)
        .replaceAll(" ", "");

    return `\\frac{${numerator}}{${reducedDenominator}}`;
}

const questions = [];

for (let index = 0; index < 50; index++) {
    const firstCoefficient = (index % 5) + 1;
    const secondCoefficient = (index % 4) + 2;
    const firstConstant = (index % 13) - 6;
    const secondConstant = ((index * 3) % 13) - 6;
    const coefficient = firstCoefficient + secondCoefficient;
    const constant = firstConstant + secondConstant;

    questions.push({
        level: 1,
        expression: `${formatTerm(firstCoefficient, "x", true)}${formatTerm(firstConstant, "", false)}${formatTerm(secondCoefficient, "x", false)}${formatTerm(secondConstant, "", false)}`,
        answer: formatLinear(coefficient, constant),
        validate: () => coefficient === firstCoefficient + secondCoefficient &&
            constant === firstConstant + secondConstant
    });
}

for (let index = 0; index < 50; index++) {
    const firstCoefficient = (index % 6) + 15;
    const secondCoefficient = -((index % 5) + 5);
    const firstConstant = ((index * 3) % 15) - 7;
    const secondConstant = ((index * 7) % 15) - 7;
    const coefficient = firstCoefficient + secondCoefficient;
    const constant = firstConstant + secondConstant;

    questions.push({
        level: 2,
        expression: `${formatTerm(firstCoefficient, "x", true, 10)}${formatTerm(firstConstant, "", false, 10)}${formatTerm(secondCoefficient, "x", false, 10)}${formatTerm(secondConstant, "", false, 10)}`,
        answer: formatLinear(coefficient, constant, 10),
        validate: () => coefficient === firstCoefficient + secondCoefficient &&
            constant === firstConstant + secondConstant
    });
}

const fractionTemplates = [
    { leftCoefficient: 1, leftConstant: 1, leftDenominator: 3, rightCoefficient: 2, rightConstant: 0, rightDenominator: 5 },
    { leftCoefficient: 1, leftConstant: -2, leftDenominator: 2, rightCoefficient: 3, rightConstant: 1, rightDenominator: 4 },
    { leftCoefficient: 2, leftConstant: 1, leftDenominator: 5, rightCoefficient: 1, rightConstant: -3, rightDenominator: 3 },
    { leftCoefficient: 3, leftConstant: -1, leftDenominator: 4, rightCoefficient: 2, rightConstant: 2, rightDenominator: 5 }
];

for (let index = 0; index < 50; index++) {
    const template = fractionTemplates[index % fractionTemplates.length];
    const shift = Math.floor(index / fractionTemplates.length) % 4;
    const leftConstant = template.leftConstant + shift;
    const rightConstant = template.rightConstant - shift;
    const coefficient =
        template.leftCoefficient * template.rightDenominator +
        template.rightCoefficient * template.leftDenominator;
    const constant =
        leftConstant * template.rightDenominator +
        rightConstant * template.leftDenominator;
    const denominator = template.leftDenominator * template.rightDenominator;
    const leftNumerator = formatLinear(template.leftCoefficient, leftConstant).replaceAll(" ", "");
    const rightNumerator = formatLinear(template.rightCoefficient, rightConstant).replaceAll(" ", "");

    questions.push({
        level: 3,
        expression: `\\frac{${leftNumerator}}{${template.leftDenominator}} + \\frac{${rightNumerator}}{${template.rightDenominator}}`,
        answer: formatFractionLinear(coefficient, constant, denominator),
        validate: () =>
            coefficient === template.leftCoefficient * template.rightDenominator +
            template.rightCoefficient * template.leftDenominator &&
            constant === leftConstant * template.rightDenominator +
            rightConstant * template.leftDenominator
    });
}

if (questions.length !== 150) {
    throw new Error(`Förväntade 150 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    if (!question.validate()) {
        throw new Error(`Felaktigt facit för: ${question.expression}`);
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

console.log(`Verifierade och skrev ${rows.length} förenklingar till ${outputPath}`);