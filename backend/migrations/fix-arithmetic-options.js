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
    pow(exp) {
        let result = new Frac(1, 1);
        for (let i = 0; i < exp; i++) {
            result = result.mul(this);
        }
        return result;
    }
    toDisplay() {
        if (this.d === 1) return `${this.n}`;
        return `\\frac{${this.n < 0 ? -this.n : this.n}}{${this.d}}`.replace(
            /^/,
            this.n < 0 ? "-" : ""
        );
    }
    toKey() { return `${this.n}/${this.d}`; }
}

function normalize(expr) {
    return expr
        .replace(/^\$+|\$+$/g, "")
        .replace(/\\left/g, "")
        .replace(/\\right/g, "")
        .replace(/\\cdot/g, "*")
        .replace(/\\div/g, "/")
        .trim();
}

function evaluate(expr) {
    const s = normalize(expr);
    let pos = 0;

    function skipSpace() {
        while (pos < s.length && /\s/.test(s[pos])) pos++;
    }

    function parseBraced() {
        skipSpace();
        if (s[pos] !== "{") throw new Error(`Expected '{' at ${pos} in: ${s}`);
        pos++;
        const value = parseExpr();
        skipSpace();
        if (s[pos] !== "}") throw new Error(`Expected '}' at ${pos} in: ${s}`);
        pos++;
        return value;
    }

    function parseFactor() {
        skipSpace();

        if (s.startsWith("\\frac", pos)) {
            pos += 5;
            const num = parseBraced();
            const den = parseBraced();
            return applyPow(num.div(den));
        }

        if (s[pos] === "(") {
            pos++;
            const v = parseExpr();
            skipSpace();
            pos++; // ')'
            return applyPow(v);
        }

        if (s[pos] === "-") {
            pos++;
            return applyPow(parseFactor().mul(new Frac(-1, 1)));
        }

        if (/\d/.test(s[pos])) {
            const m = /^\d+/.exec(s.slice(pos));
            pos += m[0].length;
            return applyPow(new Frac(Number(m[0]), 1));
        }

        throw new Error(`Unexpected char '${s[pos]}' at ${pos} in: ${s}`);
    }

    function applyPow(base) {
        skipSpace();
        if (s[pos] === "^") {
            pos++;
            skipSpace();
            const m = /^\d+/.exec(s.slice(pos));
            pos += m[0].length;
            return base.pow(Number(m[0]));
        }
        return base;
    }

    function parseTerm() {
        let v = parseFactor();
        skipSpace();
        while (s[pos] === "*" || s[pos] === "/") {
            const op = s[pos];
            pos++;
            const rhs = parseFactor();
            v = op === "*" ? v.mul(rhs) : v.div(rhs);
            skipSpace();
        }
        return v;
    }

    function parseExpr() {
        let v = parseTerm();
        skipSpace();
        while (s[pos] === "+" || s[pos] === "-") {
            const op = s[pos];
            pos++;
            const rhs = parseTerm();
            v = op === "+" ? v.add(rhs) : v.sub(rhs);
            skipSpace();
        }
        return v;
    }

    return parseExpr();
}

function buildDistractors(correct) {

    const pool = [
        new Frac(correct.n + correct.d, correct.d),   // +1
        new Frac(correct.n - correct.d, correct.d),   // -1
        new Frac(-correct.n, correct.d),               // sign flip
        new Frac(correct.n + 2 * correct.d, correct.d), // +2
        new Frac(correct.n * 2, correct.d * 2 === 0 ? 1 : correct.d), // double numerator (unreduced-ish / off)
        new Frac(correct.n - 2 * correct.d, correct.d)  // -2
    ];

    const seen = new Set([correct.toKey()]);
    const distractors = [];

    for (const c of pool) {
        const key = c.toKey();
        if (seen.has(key) || c.d === 0) continue;
        seen.add(key);
        distractors.push(c);
        if (distractors.length === 3) break;
    }

    let bump = 3;
    while (distractors.length < 3) {
        const c = new Frac(correct.n + bump * correct.d, correct.d);
        const key = c.toKey();
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

function formatOption(frac) {
    if (frac.d === 1) return `${frac.n}`;
    return `$${frac.toDisplay()}$`;
}

const files = [
    "../examples/rakneordning_skolig_3_nivaer.xlsx",
    "../examples/rakneordning_negativa_tal_3_nivaer.xlsx"
];

for (const filePath of files) {

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let mismatches = 0;

    const newRows = rows.map(row => {

        const question = row["Fråga"];
        let correct;
        try {
            correct = evaluate(question);
        } catch (err) {
            console.error(`Failed to parse: ${question} -> ${err.message}`);
            throw err;
        }
        const distractors = buildDistractors(correct);

        const options = shuffle([correct, ...distractors]);
        const correctIndex = options.findIndex(o => o === correct) + 1;

        const oldCorrectIndex = Number(row["Korrekta alternativ"]);
        const oldCorrectValue = row[`Alternativ ${oldCorrectIndex}`];

        if (String(oldCorrectValue) !== correct.toDisplay() && Number(oldCorrectValue) !== correct.n / correct.d) {
            mismatches++;
        }

        return {
            "Fråga": question,
            "Frågetyp": row["Frågetyp"],
            "Nivå": row["Nivå"],
            "Korrekta alternativ": String(correctIndex),
            "Alternativ 1": formatOption(options[0]),
            "Alternativ 2": formatOption(options[1]),
            "Alternativ 3": formatOption(options[2]),
            "Alternativ 4": formatOption(options[3])
        };

    });

    console.log(`${filePath}: ${mismatches}/${rows.length} rows had wrong correct answers (fixed)`);

    const newSheet = XLSX.utils.json_to_sheet(newRows);
    workbook.Sheets[sheetName] = newSheet;

    XLSX.writeFile(workbook, filePath);

    console.log(JSON.stringify(newRows[0]));
    console.log(JSON.stringify(newRows.find(r => r["Fråga"].includes("12 - 4 + 5"))));

}
