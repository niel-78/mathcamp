import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/ekvationer_3_nivaer_numeric_input.csv",
    import.meta.url
).pathname;

function formatNumber(numerator, denominator = 1) {
    if (numerator % denominator === 0) {
        return String(numerator / denominator);
    }

    return `${numerator / denominator}`.replace(".", ",");
}

function signedTerm(value) {
    return value < 0 ? ` - ${Math.abs(value)}` : ` + ${value}`;
}

const questions = [];

for (let index = 0; index < 50; index++) {
    const solution = (index % 10) + 1;
    const leftCoefficient = (index % 4) + 3;
    const rightCoefficient = (index % 3) + 1;
    const leftConstant = (index % 11) - 5;

    if (index % 3 === 0) {
        const rightConstant =
            (leftCoefficient - rightCoefficient) * solution + leftConstant;

        questions.push({
            level: 1,
            equation: `${leftCoefficient}x${signedTerm(leftConstant)} = ${rightCoefficient}x${signedTerm(rightConstant)}`,
            answer: formatNumber(solution),
            solutionNumerator: solution,
            solutionDenominator: 1,
            validate: () =>
                leftCoefficient * solution + leftConstant ===
                rightCoefficient * solution + rightConstant
        });
    } else if (index % 3 === 1) {
        const rightSide = leftCoefficient * solution + leftConstant;

        questions.push({
            level: 1,
            equation: `${leftCoefficient}x${signedTerm(leftConstant)} = ${rightSide}`,
            answer: formatNumber(solution),
            solutionNumerator: solution,
            solutionDenominator: 1,
            validate: () => leftCoefficient * solution + leftConstant === rightSide
        });
    } else {
        const rightSide = (leftCoefficient - rightCoefficient) * solution;

        questions.push({
            level: 1,
            equation: `${leftCoefficient}x = ${rightCoefficient}x${signedTerm(rightSide)}`,
            answer: formatNumber(solution),
            solutionNumerator: solution,
            solutionDenominator: 1,
            validate: () => leftCoefficient * solution === rightCoefficient * solution + rightSide
        });
    }
}

for (let index = 0; index < 50; index++) {
    const solutionNumerator = (index % 21) - 10;
    const solutionDenominator = index % 2 === 0 ? 1 : 2;
    const solution = solutionNumerator / solutionDenominator;

    if (index % 4 === 0) {
        const constant = (index % 9) - 4;
        const rightNumerator = 2 * solutionNumerator + 3 * constant * solutionDenominator;
        const rightDenominator = 3 * solutionDenominator;

        questions.push({
            level: 2,
            equation: `\\frac{2x}{3}${signedTerm(constant)} = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                2 * solutionNumerator + 3 * constant * solutionDenominator ===
                rightNumerator
        });
    } else if (index % 4 === 1) {
        const coefficient = index % 4 === 1 ? 4 : 2;
        const constant = -2 * coefficient * solution;

        questions.push({
            level: 2,
            equation: `${coefficient}x + ${coefficient}x${signedTerm(constant)} = 0`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                2 * coefficient * solutionNumerator +
                constant * solutionDenominator === 0
        });
    } else if (index % 4 === 2) {
        const constant = (index % 7) - 3;
        const rightNumerator = solutionNumerator + 2 * constant * solutionDenominator;
        const rightDenominator = 2 * solutionDenominator;

        questions.push({
            level: 2,
            equation: `\\frac{x}{2}${signedTerm(constant)} = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                solutionNumerator + 2 * constant * solutionDenominator ===
                rightNumerator
        });
    } else {
        const constant = (index % 7) - 3;
        const rightNumerator = 3 * (solutionNumerator + constant * solutionDenominator);
        const rightDenominator = solutionDenominator;

        questions.push({
            level: 2,
            equation: `3(x${signedTerm(constant)}) = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                3 * (solutionNumerator + constant * solutionDenominator) ===
                rightNumerator
        });
    }
}

for (let index = 0; index < 50; index++) {
    const solutionNumerator = (index % 21) - 10;
    const solutionDenominator = index % 2 === 0 ? 1 : 2;
    const solution = solutionNumerator / solutionDenominator;

    if (index % 4 === 0) {
        const rightNumerator = 4 * solutionNumerator;
        const rightDenominator = 3 * solutionDenominator;

        questions.push({
            level: 3,
            equation: `\\frac{x}{3} + \\frac{2x}{2} = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                4 * solutionNumerator ===
                rightNumerator
        });
    } else if (index % 4 === 1) {
        const rightNumerator = solutionNumerator - 47 * solutionDenominator;
        const rightDenominator = 2 * solutionDenominator;

        questions.push({
            level: 3,
            equation: `\\frac{x + 3}{2} - 5^2 = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                solutionNumerator - 47 * solutionDenominator ===
                rightNumerator
        });
    } else if (index % 4 === 2) {
        const rightNumerator = 7 * solutionNumerator + solutionDenominator;
        const rightDenominator = 6 * solutionDenominator;

        questions.push({
            level: 3,
            equation: `\\frac{2x - 1}{3} + \\frac{x + 2}{2} = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                7 * solutionNumerator + solutionDenominator === rightNumerator
        });
    } else {
        const rightNumerator = 5 * solutionNumerator - 8 * solutionDenominator;
        const rightDenominator = 4 * solutionDenominator;

        questions.push({
            level: 3,
            equation: `\\frac{x - 4}{2} + \\frac{3x}{4} = \\frac{${rightNumerator}}{${rightDenominator}}`,
            answer: formatNumber(solutionNumerator, solutionDenominator),
            solutionNumerator,
            solutionDenominator,
            validate: () =>
                5 * solutionNumerator - 8 * solutionDenominator === rightNumerator
        });
    }
}

if (questions.length !== 150) {
    throw new Error(`Förväntade 150 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    const solution = question.solutionNumerator / question.solutionDenominator;

    if (solution < -10 || solution > 10 || !question.validate()) {
        throw new Error(`Ogiltig ekvation: ${question.equation}`);
    }
}

const rows = questions.map(question => ({
    "Fråga": `$${question.equation}$`,
    "Frågetyp": "equation",
    "Nivå": question.level,
    "Svar": question.answer,
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} ekvationer till ${outputPath}`);