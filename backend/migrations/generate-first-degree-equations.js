import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const outputPath = path.resolve(
    process.cwd(),
    "../examples/forstagradsekvationer_3_nivaer.xlsx"
);

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a || 1;
}

function fraction(numerator, denominator = 1) {
    if (denominator === 0) {
        throw new Error("Noll får inte vara nämnare");
    }

    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);

    return {
        numerator: sign * numerator / divisor,
        denominator: sign * denominator / divisor
    };
}

function add(left, right) {
    return fraction(
        left.numerator * right.denominator + right.numerator * left.denominator,
        left.denominator * right.denominator
    );
}

function subtract(left, right) {
    return add(left, fraction(-right.numerator, right.denominator));
}

function multiply(left, right) {
    return fraction(
        left.numerator * right.numerator,
        left.denominator * right.denominator
    );
}

function formatFraction(value) {
    const reduced = fraction(value.numerator, value.denominator);

    if (reduced.denominator === 1) {
        return String(reduced.numerator);
    }

    return `\\frac{${reduced.numerator}}{${reduced.denominator}}`;
}

function formatDecimal(value) {
    const number = value.numerator / value.denominator;

    if (Number.isInteger(number)) {
        return String(number);
    }

    return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatSignedConstant(value, formatter = formatFraction) {
    const formatted = formatter(value);

    if (value.numerator < 0) {
        return ` - ${formatter(fraction(-value.numerator, value.denominator))}`;
    }

    return ` + ${formatted}`;
}

function formatCoefficient(value, formatter = formatFraction) {
    const formatted = formatter(value);

    if (value.numerator === 1 && value.denominator === 1) {
        return "x";
    }

    return `${formatted}x`;
}

function answerText(value, denominator) {
    // Reduced fractions may have a denominator that divides the requested
    // denominator (for example, -2.5 is -5/2 when the scale is quarters).
    if (value.denominator !== 1 && denominator % value.denominator !== 0) {
        throw new Error(`Svar ${formatFraction(value)} har fel nämnare`);
    }

    return formatDecimal(value);
}

function row(question, level, answer) {
    return {
        Fråga: `Lös ekvationen $${question}$.\nx = {{input}}`,
        Frågetyp: "numeric_input",
        Nivå: level,
        "Rätta svar": answer
    };
}

const levelOneTargets = [
    -6, -4.5, -3, -1.5, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10
];
const levelTwoTargets = [
    -4, -3.25, -2.5, -1.75, -1, -0.25, 0.5, 1.25,
    2, 2.75, 3.5, 4.25, 5, 5.75, 6.5, 7.25
];
const levelThreeTargets = [
    -3, -2.4, -1.8, -1.2, -0.6, 0.2, 0.8, 1.4, 2, 2.6,
    3.2, 3.8, 4.4, 5, 5.6, 6.2
];

const questions = [];

for (let index = 0; index < 100; index++) {
    const target = fraction(levelOneTargets[index % levelOneTargets.length] * 2, 2);
    const a = 3 + index % 5;
    const c = a - 2;
    const b = fraction(-4 + index % 9);
    const d = add(b, multiply(fraction(a - c), target));

    if (index % 3 === 0) {
        questions.push(row(
            `${formatCoefficient(fraction(a))}${formatSignedConstant(b)} = ${formatCoefficient(fraction(c))}${formatSignedConstant(d)}`,
            1,
            answerText(target, 2)
        ));
    } else if (index % 3 === 1) {
        const divisor = 2 + index % 4;
        const right = add(multiply(fraction(1, divisor), target), fraction(2 + index % 5));

        questions.push(row(
            `\\frac{x}{${divisor}}${formatSignedConstant(fraction(2 + index % 5))} = ${formatFraction(right)}`,
            1,
            answerText(target, 2)
        ));
    } else {
        const bracket = -3 + index % 7;
        const leftConstant = multiply(fraction(a), fraction(bracket));
        const rightConstant = add(
            multiply(fraction(a - c), target),
            leftConstant
        );

        questions.push(row(
            `${a}(x${formatSignedConstant(fraction(bracket))}) = ${formatCoefficient(fraction(c))}${formatSignedConstant(rightConstant)}`,
            1,
            answerText(target, 2)
        ));
    }
}

for (let index = 0; index < 50; index++) {
    const target = fraction(levelTwoTargets[index % levelTwoTargets.length] * 4, 4);
    const leftCoefficient = fraction(1 + index % 3, 2 + index % 3);
    const rightCoefficient = fraction(1, 2 + index % 3);
    const firstConstant = fraction(1 + index % 4, 4);
    const secondConstant = fraction(1 + index % 3, 2);
    const rightConstant = add(
        add(firstConstant, secondConstant),
        multiply(subtract(leftCoefficient, rightCoefficient), target)
    );

    questions.push(row(
        `${formatCoefficient(leftCoefficient)}${formatSignedConstant(firstConstant)}${formatSignedConstant(secondConstant)} = ${formatCoefficient(rightCoefficient)}${formatSignedConstant(rightConstant)}`,
        2,
        answerText(target, 4)
    ));
}

for (let index = 0; index < 50; index++) {
    const target = fraction(levelThreeTargets[index % levelThreeTargets.length] * 10, 10);
    const leftCoefficient = fraction(4 + index % 5);
    const innerConstant = fraction(-3 + index % 7);
    const extraCoefficient = fraction(1 + index % 3);
    const rightCoefficient = fraction(2 + index % 4);
    const leftConstant = multiply(leftCoefficient, innerConstant);
    const rightConstant = add(
        leftConstant,
        multiply(
            subtract(
                add(leftCoefficient, extraCoefficient),
                rightCoefficient
            ),
            target
        )
    );

    questions.push(row(
        `${formatFraction(leftCoefficient)}(x${formatSignedConstant(innerConstant)}) + ${formatCoefficient(extraCoefficient)} = ${formatCoefficient(rightCoefficient)}${formatSignedConstant(rightConstant)}`,
        3,
        answerText(target, 10)
    ));
}

if (questions.length !== 200) {
    throw new Error(`Förväntade 200 uppgifter, fick ${questions.length}`);
}

const counts = questions.reduce((result, question) => {
    result[question.Nivå] = (result[question.Nivå] || 0) + 1;
    return result;
}, {});

if (counts[1] !== 100 || counts[2] !== 50 || counts[3] !== 50) {
    throw new Error(`Fel nivåfördelning: ${JSON.stringify(counts)}`);
}

const worksheet = XLSX.utils.json_to_sheet(questions);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Frågor");
XLSX.writeFile(workbook, outputPath);

console.log(`Skrev ${questions.length} uppgifter till ${outputPath}`);