import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/parallella_vinkelrata_linjer_2_nivaer.csv",
    import.meta.url
).pathname;

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) [a, b] = [b, a % b];
    return a || 1;
}

// Exact rational slope, used to independently verify every displayed equation.
class Frac {
    constructor(n, d = 1) {
        if (d < 0) { n = -n; d = -d; }
        const g = gcd(n, d);
        this.n = n / g;
        this.d = d / g;
    }
    mul(other) { return new Frac(this.n * other.n, this.d * other.d); }
    equals(other) { return this.n === other.n && this.d === other.d; }
}

function signedTerm(coefficient, variable, first) {
    if (coefficient === 0) return "";
    const magnitude = Math.abs(coefficient) === 1 ? variable : `${Math.abs(coefficient)}${variable}`;
    if (first) return coefficient < 0 ? `-${magnitude}` : magnitude;
    return coefficient < 0 ? ` - ${magnitude}` : ` + ${magnitude}`;
}

function signedConstant(constant, first) {
    if (constant === 0) return first ? "0" : "";
    if (first) return String(constant);
    return constant < 0 ? ` - ${Math.abs(constant)}` : ` + ${constant}`;
}

// Every line is stored as Ax + By + C = 0; slope is always derived as -A/B,
// so the displayed text and the verified slope can never drift apart.
function kForm(k, m) {
    const body = `${signedTerm(k, "x", true)}${signedConstant(m, false)}` || "0";
    return { text: `y=${body}`, A: -k, B: 1, C: -m };
}

function generalForm(A, B, C) {
    const parts = [
        signedTerm(A, "x", true),
        signedTerm(B, "y", A === 0),
        signedConstant(C, A === 0 && B === 0)
    ].join("");
    return { text: `${parts} = 0`, A, B, C };
}

function slopeOf(line) {
    return new Frac(-line.A, line.B);
}

function shuffle(array, seed) {
    const result = [...array];
    let state = seed;
    for (let i = result.length - 1; i > 0; i--) {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        const j = state % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

const K_SET = [2, 3, 4, 5, -2, -3, -4, -5, 6, -6];
const questions = [];

for (let index = 0; index < 25; index++) {
    const k = K_SET[index % K_SET.length];
    const m1 = (index * 2 % 9) - 4;
    const m2 = m1 + ((index % 4) + 2);
    const m3 = m1 - ((index % 3) + 1);
    const divisor = Math.abs(k) === 2 ? 3 : 2;
    const m4 = m2 + ((index % 5) + 1);
    const m5 = m3 - ((index % 5) + 1);

    const lines = [
        { ...kForm(k, m1), isCorrect: true },
        { ...generalForm(k, -1, m2), isCorrect: true },
        { ...kForm(-k, m3), isCorrect: false },
        { ...generalForm(k, -divisor, m4), isCorrect: false },
        { ...generalForm(divisor, -k, m5), isCorrect: false }
    ];

    const slopes = lines.map(slopeOf);
    let equalPairs = 0;
    for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
            if (slopes[i].equals(slopes[j])) equalPairs++;
        }
    }
    const intendedEqual = lines[0].isCorrect && lines[1].isCorrect &&
        slopes[0].equals(slopes[1]);

    if (equalPairs !== 1 || !intendedEqual) {
        throw new Error(`Nivå 1, index ${index}: förväntade exakt ett parallellt par (k=${k})`);
    }

    questions.push({ level: 1, lines });
}

const K_SET_PERPENDICULAR = [2, 3, 4, 5, -2, -3, -4, -5, 6, -6];

for (let index = 0; index < 25; index++) {
    const k1 = K_SET_PERPENDICULAR[index % K_SET_PERPENDICULAR.length];
    const m1 = (index * 2 % 9) - 4;
    const m2 = m1 + ((index % 4) + 2);
    const m3 = m1 - ((index % 3) + 1);
    const m4 = m2 + ((index % 5) + 1);
    const m5 = m3 - ((index % 5) + 1);

    const lines = [
        { ...kForm(k1, m1), isCorrect: true },
        { ...generalForm(1, k1, m2), isCorrect: true },
        { ...kForm(-k1, m3), isCorrect: false },
        { ...generalForm(-(k1 + 1), 1, m4), isCorrect: false },
        { ...generalForm(1 - k1, 1, m5), isCorrect: false }
    ];

    const slopes = lines.map(slopeOf);
    const negativeOne = new Frac(-1, 1);
    let perpendicularPairs = 0;
    for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
            if (slopes[i].mul(slopes[j]).equals(negativeOne)) perpendicularPairs++;
        }
    }
    const intendedPerpendicular = lines[0].isCorrect && lines[1].isCorrect &&
        slopes[0].mul(slopes[1]).equals(negativeOne);

    if (perpendicularPairs !== 1 || !intendedPerpendicular) {
        throw new Error(`Nivå 2, index ${index}: förväntade exakt ett vinkelrätt par (k1=${k1})`);
    }

    questions.push({ level: 2, lines });
}

if (questions.length !== 50) {
    throw new Error(`Förväntade 50 frågor, fick ${questions.length}`);
}

const rows = questions.map((question, index) => {
    const ordered = shuffle(
        question.lines.map((line, position) => ({ ...line, position })),
        1000 + index
    );
    const correctNumbers = ordered
        .map((line, position) => (line.isCorrect ? position + 1 : null))
        .filter(Boolean);

    if (correctNumbers.length !== 2) {
        throw new Error(`Fråga ${index}: förväntade exakt 2 korrekta alternativ`);
    }

    const row = {
        "Fråga": question.level === 1
            ? "Vilka räta linjer är parallella med varandra?"
            : "Vilka räta linjer är vinkelräta mot varandra?",
        "Frågetyp": "multiple_choice",
        "Nivå": question.level,
        // ";" avoids XLSX misreading e.g. "4,5" as the number 45 on CSV re-parse.
        "Korrekta alternativ": correctNumbers.join(";"),
        "Miniräknare tillåten": "Nej"
    };

    ordered.forEach((line, position) => {
        row[`Alternativ ${position + 1}`] = `$${line.text}$`;
    });

    return row;
});

const worksheet = XLSX.utils.json_to_sheet(rows);
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} frågor till ${outputPath}`);
