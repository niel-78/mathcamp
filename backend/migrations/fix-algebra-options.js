import XLSX from "xlsx";

function add(p, q) {
    return { a: p.a + q.a, b: p.b + q.b };
}

function scale(p, k) {
    return { a: p.a * k, b: p.b * k };
}

function simplify(expr) {

    const s = expr
        .replace(/^Förenkla:\s*/i, "")
        .replace(/^\$+|\$+$/g, "")
        .trim();

    let pos = 0;

    function skipSpace() {
        while (pos < s.length && /\s/.test(s[pos])) pos++;
    }

    function parseTerm(sign) {
        skipSpace();

        const m = /^\d+/.exec(s.slice(pos));
        const numStr = m ? m[0] : null;
        if (numStr) pos += numStr.length;

        skipSpace();

        if (s[pos] === "x") {
            pos++;
            const coeff = numStr ? Number(numStr) : 1;
            return { a: sign * coeff, b: 0 };
        }

        if (s[pos] === "(") {
            pos++;
            const inner = parseExpr();
            skipSpace();
            pos++; // ')'
            const coeff = numStr ? Number(numStr) : 1;
            return scale(inner, sign * coeff);
        }

        // bare number (no x, no paren)
        const value = numStr ? Number(numStr) : 0;
        return { a: 0, b: sign * value };
    }

    function parseExpr() {
        let result = { a: 0, b: 0 };
        let sign = 1;
        let first = true;

        while (pos < s.length) {

            skipSpace();

            if (s[pos] === ")") break;

            if (s[pos] === "+") { sign = 1; pos++; }
            else if (s[pos] === "-") { sign = -1; pos++; }
            else if (!first) break;

            const term = parseTerm(sign);
            result = add(result, term);
            first = false;
            sign = 1;

        }

        return result;
    }

    return parseExpr();
}

function formatLinear({ a, b }) {

    let termA = "";

    if (a !== 0) {
        if (a === 1) termA = "x";
        else if (a === -1) termA = "-x";
        else termA = `${a}x`;
    }

    if (a === 0) {
        return `${b}`;
    }

    if (b === 0) {
        return termA;
    }

    return b > 0 ? `${termA}+${b}` : `${termA}${b}`;
}

function key(v) { return `${v.a}/${v.b}`; }

function buildDistractors(correct) {

    const { a, b } = correct;

    const pool = [
        { a: -a, b: b },
        { a: a, b: -b },
        { a: -a, b: -b },
        { a: a, b: b + 2 },
        { a: a, b: b - 2 },
        { a: a + 1, b: b },
        { a: a - 1, b: b },
        { a: a + 2, b: b },
        { a: a, b: b + 4 },
        { a: a, b: b - 4 }
    ];

    const seen = new Set([key(correct)]);
    const distractors = [];

    for (const c of pool) {
        const k = key(c);
        if (seen.has(k)) continue;
        seen.add(k);
        distractors.push(c);
        if (distractors.length === 3) break;
    }

    let bump = 5;
    while (distractors.length < 3) {
        const c = { a, b: b + bump };
        const k = key(c);
        if (!seen.has(k)) {
            seen.add(k);
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

const filePath = "../examples/distributiv_lag_och_förenkling_3_nivaer.xlsx";

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet);

let mismatches = 0;
let dupFixed = 0;

const newRows = rows.map(row => {

    const question = row["Fråga"];
    const correct = simplify(question);

    const oldCorrectIndex = Number(row["Korrekta alternativ"]);
    const oldOptions = [1, 2, 3, 4].map(n => String(row[`Alternativ ${n}`]));
    const uniqueOldOptions = new Set(oldOptions);

    if (uniqueOldOptions.size < 4) dupFixed++;

    const oldCorrectValue = oldOptions[oldCorrectIndex - 1];
    if (oldCorrectValue !== `$${formatLinear(correct)}$`) mismatches++;

    const distractors = buildDistractors(correct);
    const options = shuffle([correct, ...distractors]);
    const correctIndex = options.findIndex(o => o === correct) + 1;

    return {
        "Fråga": question,
        "Frågetyp": row["Frågetyp"],
        "Nivå": row["Nivå"],
        "Korrekta alternativ": String(correctIndex),
        "Alternativ 1": `$${formatLinear(options[0])}$`,
        "Alternativ 2": `$${formatLinear(options[1])}$`,
        "Alternativ 3": `$${formatLinear(options[2])}$`,
        "Alternativ 4": `$${formatLinear(options[3])}$`
    };

});

console.log(`${filePath}: ${mismatches}/${rows.length} wrong correct answers, ${dupFixed}/${rows.length} rows had duplicate options`);

const newSheet = XLSX.utils.json_to_sheet(newRows);
workbook.Sheets[sheetName] = newSheet;

XLSX.writeFile(workbook, filePath);

console.log(JSON.stringify(newRows[0]));
console.log(JSON.stringify(newRows.find(r => r["Fråga"].includes("-2(x-3)"))));
