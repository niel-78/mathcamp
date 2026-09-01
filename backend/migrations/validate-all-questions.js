import db from "../db.js";

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
        for (let i = 0; i < exp; i++) result = result.mul(this);
        return result;
    }
    valueEquals(other) { return this.n * other.d === other.n * this.d; }
    toDisplay() {
        if (this.d === 1) return `${this.n}`;
        const sign = this.n < 0 ? "-" : "";
        return `${sign}\\frac{${Math.abs(this.n)}}{${this.d}}`;
    }
}

function evaluateArithmetic(expr) {

    const s = expr
        .replace(/^\$+|\$+$/g, "")
        .replace(/\\left/g, "")
        .replace(/\\right/g, "")
        .replace(/\\cdot/g, "*")
        .replace(/ cdot /g, "*")
        .replace(/\\div/g, "/")
        .trim();

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
            pos++;
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

function parseOptionValue(text) {
    const s = text.replace(/^\$+|\$+$/g, "").trim();
    const m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);
    if (m) {
        const sign = m[1] === "-" ? -1 : 1;
        return new Frac(sign * Number(m[2]), Number(m[3]));
    }
    if (/^-?\d+$/.test(s)) return new Frac(Number(s), 1);
    return null;
}

const [rows] = await db.query(`
    SELECT q.id, q.block_id, q.question, q.question_type,
           o.id AS option_id, o.text AS option_text, o.is_correct
    FROM questions q
    LEFT JOIN options o ON o.question_id = q.id
    WHERE q.question_type IN ('single_choice','multiple_choice')
    AND q.deleted_at IS NULL AND q.archived_at IS NULL
    ORDER BY q.id
`);

const byQuestion = new Map();
for (const row of rows) {
    if (!byQuestion.has(row.id)) {
        byQuestion.set(row.id, { block_id: row.block_id, question: row.question, options: [] });
    }
    byQuestion.get(row.id).options.push({ id: row.option_id, text: row.option_text, is_correct: row.is_correct });
}

let checked = 0;
let mismatches = 0;
let unparsable = 0;
let duplicateValueIssues = 0;

for (const [qid, data] of byQuestion) {

    if (data.question.includes("x")) continue; // skip algebra questions (different evaluator)

    let correctExpr;
    try {
        correctExpr = evaluateArithmetic(data.question);
    } catch {
        unparsable++;
        continue;
    }

    checked++;

    const parsedOptions = data.options.map(o => ({ ...o, value: parseOptionValue(o.text) }));

    // Check labeled-correct option matches computed value
    const labeledCorrect = parsedOptions.find(o => o.is_correct);
    if (labeledCorrect && labeledCorrect.value && !labeledCorrect.value.valueEquals(correctExpr)) {
        mismatches++;
        console.log(`MISMATCH q${qid} (block ${data.block_id}) "${data.question}" labeled correct="${labeledCorrect.text}" computed="${correctExpr.toDisplay()}"`);
    }

    // Check for duplicate VALUE among the options (even if display differs)
    for (let i = 0; i < parsedOptions.length; i++) {
        for (let j = i + 1; j < parsedOptions.length; j++) {
            const a = parsedOptions[i].value;
            const b = parsedOptions[j].value;
            if (a && b && a.valueEquals(b)) {
                duplicateValueIssues++;
                console.log(`DUPLICATE VALUE q${qid} (block ${data.block_id}) "${data.question}" opt="${parsedOptions[i].text}" == opt="${parsedOptions[j].text}"`);
            }
        }
    }

}

console.log(`\nChecked ${checked} arithmetic/fraction questions, ${unparsable} unparsable (likely algebra), ${mismatches} wrong-answer mismatches, ${duplicateValueIssues} duplicate-value option pairs.`);

process.exit(0);
