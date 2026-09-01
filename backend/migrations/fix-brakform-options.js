import XLSX from "xlsx";

class Frac {
    constructor(n, d = 1) {
        if (d < 0) { n = -n; d = -d; }
        const g = Frac.gcd(Math.abs(n), Math.abs(d)) || 1;
        this.n = n / g;
        this.d = d / g;
    }
    static gcd(a, b) { return b === 0 ? a : Frac.gcd(b, a % b); }
    add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { return new Frac(this.n * o.d, this.d * o.n); }
    equals(o) { return this.n === o.n && this.d === o.d; }
    toLatex() {
        if (this.d === 1) return `${this.n}`;
        if (this.n < 0) return `-\\frac{${-this.n}}{${this.d}}`;
        return `\\frac{${this.n}}{${this.d}}`;
    }
}

function tokenize(expr) {
    let s = expr
        .replace(/^\$+|\$+$/g, "")
        .replace(/\\left/g, "")
        .replace(/\\right/g, "")
        .replace(/\\cdot/g, "*")
        .replace(/\\div/g, "/")
        .trim();

    const tokens = [];
    let i = 0;

    while (i < s.length) {
        const c = s[i];

        if (/\s/.test(c)) { i++; continue; }

        if (s.startsWith("\\frac{", i)) {
            const m = /^\\frac\{(-?\d+)\}\{(-?\d+)\}/.exec(s.slice(i));
            tokens.push({ type: "num", value: new Frac(Number(m[1]), Number(m[2])) });
            i += m[0].length;
            continue;
        }

        if (/\d/.test(c)) {
            const m = /^\d+/.exec(s.slice(i));
            tokens.push({ type: "num", value: new Frac(Number(m[0]), 1) });
            i += m[0].length;
            continue;
        }

        if ("+-*/()".includes(c)) {
            tokens.push({ type: c });
            i++;
            continue;
        }

        throw new Error(`Unexpected char '${c}' in expr: ${expr}`);
    }

    return tokens;
}

function parse(tokens) {
    let pos = 0;

    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }

    function parseFactor() {
        const t = peek();
        if (t.type === "(") {
            next();
            const v = parseExpr();
            next(); // ')'
            return v;
        }
        if (t.type === "-") {
            next();
            return parseFactor().mul(new Frac(-1, 1));
        }
        return next().value;
    }

    function parseTerm() {
        let v = parseFactor();
        while (peek() && (peek().type === "*" || peek().type === "/")) {
            const op = next().type;
            const rhs = parseFactor();
            v = op === "*" ? v.mul(rhs) : v.div(rhs);
        }
        return v;
    }

    function parseExpr() {
        let v = parseTerm();
        while (peek() && (peek().type === "+" || peek().type === "-")) {
            const op = next().type;
            const rhs = parseTerm();
            v = op === "+" ? v.add(rhs) : v.sub(rhs);
        }
        return v;
    }

    return parseExpr();
}

function evaluate(expr) {
    return parse(tokenize(expr));
}

function buildDistractors(correct) {

    const candidates = [];

    // reciprocal
    if (correct.n !== 0) {
        candidates.push(new Frac(correct.d, correct.n));
    }

    // off by one in numerator
    candidates.push(new Frac(correct.n + 1, correct.d));

    // off by one in denominator
    candidates.push(new Frac(correct.n, correct.d + 1));

    // sign flip
    candidates.push(new Frac(-correct.n, correct.d));

    const seen = new Set([`${correct.n}/${correct.d}`]);
    const distractors = [];

    for (const c of candidates) {

        const key = `${c.n}/${c.d}`;

        if (seen.has(key) || c.d === 0) {
            continue;
        }

        seen.add(key);
        distractors.push(c);

        if (distractors.length === 3) {
            break;
        }

    }

    let bump = 2;

    while (distractors.length < 3) {

        const c = new Frac(correct.n + bump, correct.d);
        const key = `${c.n}/${c.d}`;

        if (!seen.has(key)) {
            seen.add(key);
            distractors.push(c);
        }

        bump++;

    }

    return distractors;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const filePath = "../examples/brakform_4_rakn_3_nivaer.xlsx";

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet);

const newRows = rows.map((row, idx) => {

    const question = row["Fråga"];
    const correct = evaluate(question);
    const distractors = buildDistractors(correct);

    const options = shuffle([correct, ...distractors]);
    const correctIndex = options.findIndex(o => o === correct) + 1;

    return {
        "Fråga": question,
        "Frågetyp": row["Frågetyp"],
        "Nivå": row["Nivå"],
        "Korrekta alternativ": String(correctIndex),
        "Alternativ 1": `$${options[0].toLatex()}$`,
        "Alternativ 2": `$${options[1].toLatex()}$`,
        "Alternativ 3": `$${options[2].toLatex()}$`,
        "Alternativ 4": `$${options[3].toLatex()}$`
    };

});

const newSheet = XLSX.utils.json_to_sheet(newRows);
workbook.Sheets[sheetName] = newSheet;

XLSX.writeFile(workbook, filePath);

console.log(`Fixed ${newRows.length} rows in ${filePath}`);
console.log(JSON.stringify(newRows[0]));
console.log(JSON.stringify(newRows[3]));
console.log(JSON.stringify(newRows[99]));
