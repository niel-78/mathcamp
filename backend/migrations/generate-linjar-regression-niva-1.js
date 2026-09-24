import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/linjar_regression_niva_1.csv",
    import.meta.url
).pathname;

const X_VALUES = [1, 2, 3, 4];
const SLOPES = [0.5, 1, 1.5, -0.5, -1, 2, -1.5, 0.8, -0.8, 1.2];
const INTERCEPTS = [1, 2, 3, -1, 0.5, 4, -2, 2.5, 1.5, -0.5];
// Tiny alternating noise keeps every point almost on the underlying line.
const NOISE_CYCLES = [
    [0.1, -0.1, 0.1, -0.1],
    [-0.1, 0.1, -0.1, 0.1],
    [0.1, 0.1, -0.1, -0.1],
    [-0.1, -0.1, 0.1, 0.1]
];

function linearRegression(points) {
    const n = points.length;
    const xMean = points.reduce((sum, [x]) => sum + x, 0) / n;
    const yMean = points.reduce((sum, [, y]) => sum + y, 0) / n;
    const numerator = points.reduce(
        (sum, [x, y]) => sum + (x - xMean) * (y - yMean), 0
    );
    const denominator = points.reduce(
        (sum, [x]) => sum + (x - xMean) ** 2, 0
    );
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    return { slope, intercept };
}

function formatAnswer(slope, intercept) {
    const sign = intercept < 0 ? "-" : "+";
    return `y = ${slope.toFixed(2)}x ${sign} ${Math.abs(intercept).toFixed(2)}`;
}

const questions = [];

for (let index = 0; index < 25; index++) {
    const k = SLOPES[index % SLOPES.length];
    const m = INTERCEPTS[index % INTERCEPTS.length];
    const noise = NOISE_CYCLES[index % NOISE_CYCLES.length];

    const points = X_VALUES.map((x, i) => {
        const y = Number((k * x + m + noise[i]).toFixed(1));
        return [x, y];
    });

    const maxDeviation = Math.max(
        ...points.map(([x, y]) => Math.abs(y - (k * x + m)))
    );

    if (maxDeviation > 0.15) {
        throw new Error(`Fråga ${index}: punkterna avviker för mycket från linjen (${maxDeviation})`);
    }

    const { slope, intercept } = linearRegression(points);

    const table = [
        "| x | y |",
        "|---|---|",
        ...points.map(([x, y]) => `| ${x} | ${y.toFixed(1)} |`)
    ].join("\n");

    questions.push({
        question: `Bestäm med hjälp av regression den bäst anpassade linjen för värdena nedan. Svara med två decimaler.\n\n${table}`,
        answer: formatAnswer(slope, intercept)
    });
}

if (questions.length !== 25) {
    throw new Error(`Förväntade 25 frågor, fick ${questions.length}`);
}

const rows = questions.map(question => ({
    "Fråga": question.question,
    "Frågetyp": "text",
    "Nivå": 1,
    "Svar": question.answer,
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} regressionsfrågor till ${outputPath}`);
