import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/multiplicera_in_i_parenteser_2_nivaer.csv",
    import.meta.url
).pathname;

function signed(value) {
    return value < 0 ? ` - ${Math.abs(value)}` : ` + ${value}`;
}

function term(coefficient, variable, first = false) {
    if (coefficient === 0) return "";
    const absolute = Math.abs(coefficient);
    const body = variable && absolute === 1 ? variable : `${absolute}${variable}`;
    if (first) return coefficient < 0 ? `-${body}` : body;
    return coefficient < 0 ? ` - ${body}` : ` + ${body}`;
}

function formatLinear(xCoefficient, constant) {
    const first = term(xCoefficient, "x", true);
    if (constant === 0) return first || "0";
    return `${first}${signed(constant)}`;
}

function formatPolynomial(terms) {
    const entries = Object.entries(terms).filter(([, coefficient]) => coefficient !== 0);
    if (entries.length === 0) return "0";

    return entries.map(([variable, coefficient], index) => (
        variable === "constant"
            ? (index === 0 ? String(coefficient) : signed(coefficient))
            : term(coefficient, variable, index === 0)
    )).join("");
}

const questions = [];

const level1Templates = [
    [2, 1, -4], [3, 2, -1], [4, 3, 2], [5, 1, 6], [6, 2, 3],
    [2, 4, 0], [3, 3, -2], [4, 1, 5], [5, 2, -5], [6, 3, -1],
    [7, 1, 4], [2, 5, 1], [3, 4, -6], [4, 2, 0], [5, 3, 2],
    [6, 1, -3], [7, 2, 5], [2, 4, -1], [3, 5, -4], [4, 2, 6],
    [5, 1, 0], [6, 1, -5], [7, 3, 1], [2, 5, 3], [3, 2, 4]
];

for (let index = 0; index < 25; index++) {
    const [outer, innerX, innerConstant] = level1Templates[index];
    const coefficient = outer * innerX;
    const constant = outer * innerConstant;

    questions.push({
        level: 1,
        expression: `${outer}(${formatLinear(innerX, innerConstant)})`,
        answer: formatLinear(coefficient, constant),
        validate: () => coefficient === outer * innerX && constant === outer * innerConstant
    });
}

const level2Templates = [
    ["sumQuadratic", 3, -2, 5, -1, 7, 1, -3], ["xy", 3, 2, 3], ["multiQuadratic", 2, 3, 1, -2], ["quadratic", 5, 1, 6], ["xySingle", 6, 2],
    ["xy", 2, 4, 1], ["sumQuadratic", -4, 3, 2, 1, -5, 3, -2], ["singleXY", 4, 5], ["quadratic", 5, 2, -5], ["multiQuadratic", 3, 2, 3, 4],
    ["singleQuadratic", 7, 2], ["xy", 2, 5, 1], ["multiXY", 3, 2, 4, -1], ["sumQuadratic", 2, -3, 4, 2, 6, 1, -4], ["quadratic", 4, 2, 3],
    ["xy", 6, 1, -3], ["multiQuadratic", 2, 4, 5, 0], ["sumQuadratic", -5, 2, 3, -1, 4, 2, 1], ["xySingle", 5, 2], ["multiXY", 4, 2, 3, 2],
    ["xy", 5, 1, 4], ["singleXY", 6, 1], ["quadratic", 7, 3, 1], ["sumQuadratic", 4, -2, 5, 3, -7, 1, 2], ["singleQuadratic", 5, 3]
];

for (let index = 0; index < 25; index++) {
    const [kind, outer, factor, firstCoefficient, secondCoefficient = 0] = level2Templates[index];

    if (kind === "quadratic" || kind === "singleQuadratic") {
        const terms = {
            "x^2": outer * factor,
            "x": kind === "singleQuadratic" ? 0 : outer * firstCoefficient
        };

        questions.push({
            level: 2,
            expression: `${outer}x(${formatLinear(factor, kind === "singleQuadratic" ? 0 : firstCoefficient)})`,
            answer: formatPolynomial(terms),
            validate: () => terms["x^2"] === outer * factor &&
                terms.x === (kind === "singleQuadratic" ? 0 : outer * firstCoefficient)
        });
    } else if (kind === "multiQuadratic") {
        const combinedOuter = outer * factor;
        const terms = {
            "x^2": combinedOuter * firstCoefficient,
            "x": combinedOuter * secondCoefficient
        };

        questions.push({
            level: 2,
            expression: `${combinedOuter}x(${formatLinear(firstCoefficient, secondCoefficient)})`,
            answer: formatPolynomial(terms),
            validate: () => terms["x^2"] === combinedOuter * firstCoefficient &&
                terms.x === combinedOuter * secondCoefficient
        });
    } else if (kind === "multiXY") {
        const combinedOuter = outer * factor;
        const terms = {
            "xy": combinedOuter * firstCoefficient,
            "y": combinedOuter * secondCoefficient
        };

        questions.push({
            level: 2,
            expression: `${combinedOuter}y(${term(firstCoefficient, "x", true)}${term(secondCoefficient, "", false)})`,
            answer: formatPolynomial(terms),
            validate: () => terms.xy === combinedOuter * firstCoefficient &&
                terms.y === combinedOuter * secondCoefficient
        });
    } else if (kind === "sumQuadratic") {
        const [, baseX, xOuter, innerX, innerConstant, linearOuter, linearX, linearConstant] = level2Templates[index];
        const terms = {
            "x^2": xOuter * innerX,
            "x": baseX + xOuter * innerConstant + linearOuter * linearX,
            "constant": linearOuter * linearConstant
        };

        questions.push({
            level: 2,
            expression: `${term(baseX, "x", true)}${term(xOuter, "x", false)}(${formatLinear(innerX, innerConstant)})${term(linearOuter, "", false)}(${formatLinear(linearX, linearConstant)})`,
            answer: formatPolynomial(terms),
            validate: () => terms["x^2"] === xOuter * innerX &&
                terms.x === baseX + xOuter * innerConstant + linearOuter * linearX &&
                terms.constant === linearOuter * linearConstant
        });
    } else {
        const terms = {
            "xy": outer * factor,
            "y": kind === "xySingle" || kind === "singleXY" ? 0 : outer * firstCoefficient
        };

        questions.push({
            level: 2,
            expression: `${outer}y(${term(factor, "x", true)}${
                kind === "xySingle" || kind === "singleXY" ? "" : term(firstCoefficient, "", false)
            })`,
            answer: formatPolynomial(terms),
            validate: () => terms.xy === outer * factor &&
                terms.y === (kind === "xySingle" || kind === "singleXY" ? 0 : outer * firstCoefficient)
        });
    }
}

if (questions.length !== 50) {
    throw new Error(`Förväntade 50 frågor, fick ${questions.length}`);
}

for (const question of questions) {
    if (!question.validate()) {
        throw new Error(`Ogiltigt facit för ${question.expression}`);
    }
}

const rows = questions.map(question => ({
    "Fråga": `Multiplicera in och förenkla: $${question.expression}$. Svar: {{input}}`,
    "Frågetyp": "text",
    "Nivå": question.level,
    "Svar": `$${question.answer}$`,
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} uppgifter till ${outputPath}`);
