import db from "../db.js";
import { parse as parseMathExpression } from "mathjs";
import { factorizeExpression } from "../../shared/grading/factorization.js";

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function normalizeValue(text) {
    const s = String(text ?? "")
        .replace(/^\$+|\$+$/g, "")
        .replace(/\s+/g, "")
        .trim();

    const fracMatch = /^(-)?\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);
    if (fracMatch) {
        const sign = fracMatch[1] ? -1 : 1;
        const n = sign * Number(fracMatch[2]);
        const d = Number(fracMatch[3]);
        const g = gcd(Math.abs(n), d) || 1;
        return `${n / g}/${d / g}`;
    }

    const slashMatch = /^(-)?(\d+)\s*\/\s*(\d+)$/.exec(s);
    if (slashMatch) {
        const sign = slashMatch[1] ? -1 : 1;
        const n = sign * Number(slashMatch[2]);
        const d = Number(slashMatch[3]);
        if (d !== 0) {
            const g = gcd(Math.abs(n), d) || 1;
            return `${n / g}/${d / g}`;
        }
    }

    if (/^-?\d+$/.test(s)) {
        return `${Number(s)}/1`;
    }

    const linearMatch = /^(-?\d*)([a-zA-Z])([+-]\d+)?$/.exec(s);
    if (linearMatch) {
        const aStr = linearMatch[1];
        const variable = linearMatch[2];
        const a = aStr === "" ? 1 : aStr === "-" ? -1 : Number(aStr);
        const b = linearMatch[3] ? Number(linearMatch[3]) : 0;
        return `lin:${variable}:${a}:${b}`;
    }

    return `raw:${s}`;
}

export function checkOptionValues(options) {
    const items = (options || []).map(option => ({
        ...option,
        norm: normalizeValue(option.text)
    }));

    const issues = [];
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (items[i].norm !== items[j].norm) {
                continue;
            }
            if (items[i].is_correct || items[j].is_correct) {
                issues.push(
                    `"${items[i].text}" och "${items[j].text}" har samma värde som facit`
                );
            } else {
                issues.push(
                    `"${items[i].text}" och "${items[j].text}" har samma värde`
                );
            }
        }
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

export function syncNumericInputs(text, correctCount) {
    const cleanText = (text || "").trim();

    const lines = cleanText.split("\n");
    while (lines.length > 0) {
        const lastLine = lines[lines.length - 1].trim();
        if (
            lastLine === "{{input}}" ||
            /^(?:svar:\s*)?(?:[a-zA-Z](?:_\d+)?\s*=\s*)?\{\{input\}\}\s*$/i.test(lastLine)
        ) {
            lines.pop();
        } else {
            break;
        }
    }

    return lines
        .join("\n")
        .replace(/\s*Skriv\s+[^.!?\n]*\{\{input\}\}[^.!?\n]*[.!?]?/gi, "")
        .replace(/\s*(?:Svar|Svara)\s*:\s*\{\{input\}\}\s*[.!?]?/gi, "")
        .replace(/\{\{input\}\}/g, "")
        .replace(/\s+([,.!?])/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

export class Frac {
    constructor(n, d = 1) {
        if (d < 0) { n = -n; d = -d; }
        const g = Frac.gcd(Math.abs(n), Math.abs(d)) || 1;
        this.n = n / g;
        this.d = d / g;
    }
    static gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a || 1;
    }
    add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { return new Frac(this.n * o.d, this.d * o.n); }
    pow(exp) {
        if (exp === 0) return new Frac(1, 1);
        if (exp < 0) return (new Frac(this.d, this.n)).pow(-exp);
        let result = new Frac(1, 1);
        for (let i = 0; i < exp; i++) result = result.mul(this);
        return result;
    }
    toDisplay() {
        if (this.d === 1) return `${this.n}`;
        const sign = this.n < 0 ? "-" : "";
        return `${sign}\\frac{${Math.abs(this.n)}}{${this.d}}`;
    }
    toKey() { return `${this.n}/${this.d}`; }
    toNumber() { return this.n / this.d; }
}

export function evaluateArithmetic(expr) {
    if (!expr || typeof expr !== "string") return null;

    let s = expr.trim();

    // 1. Extract math inside $...$ if available
    const mathMatch = /\$([^$]+)\$/.exec(s);
    if (mathMatch) {
        s = mathMatch[1].trim();
    } else {
        // Strip Swedish prompt text
        s = s
            .replace(/^(Beräkna|Förenkla|Bestäm värdet av|Vad är|Hur mycket är):?\s*/i, "")
            .replace(/Beräkna|Förenkla|Bestäm värdet av|Vad är|Hur mycket är/gi, "")
            .replace(/^\$+|\$+$/g, "")
            .trim();
    }

    s = s
        .replace(/\\left/g, "")
        .replace(/\\right/g, "")
        .replace(/\\cdot/g, "*")
        .replace(/\s*cdot\s*/g, "*")
        .replace(/\\div/g, "/")
        .replace(/·/g, "*")
        .trim();

    if (!s) return null;

    let pos = 0;
    function skipSpace() { while (pos < s.length && /\s/.test(s[pos])) pos++; }

    function parseBraced() {
        skipSpace();
        if (s[pos] !== "{") throw new Error("Expected {");
        pos++;
        const val = parseExpr();
        skipSpace();
        if (s[pos] !== "}") throw new Error("Expected }");
        pos++;
        return val;
    }

    function parseFactor() {
        skipSpace();
        if (s.startsWith("\\frac", pos)) {
            pos += 5;
            const n = parseBraced();
            const d = parseBraced();
            return applyPow(n.div(d));
        }
        if (s[pos] === "(") {
            pos++;
            const v = parseExpr();
            skipSpace();
            if (s[pos] === ")") pos++;
            return applyPow(v);
        }
        if (s[pos] === "-") {
            pos++;
            return applyPow(parseFactor().mul(new Frac(-1, 1)));
        }
        if (s[pos] === "+") {
            pos++;
            return applyPow(parseFactor());
        }
        if (/\d/.test(s[pos])) {
            const m = /^\d+/.exec(s.slice(pos));
            pos += m[0].length;
            return applyPow(new Frac(Number(m[0]), 1));
        }
        throw new Error("Unexpected char: " + s[pos]);
    }

    function applyPow(base) {
        skipSpace();
        if (s[pos] === "^") {
            pos++;
            skipSpace();
            let exp;
            if (s[pos] === "{") {
                exp = Number(parseBraced().n);
            } else {
                const m = /^-?\d+/.exec(s.slice(pos));
                if (!m) throw new Error("Expected exponent");
                pos += m[0].length;
                exp = Number(m[0]);
            }
            return base.pow(exp);
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

    try {
        const result = parseExpr();
        skipSpace();
        if (pos === s.length) {
            return result;
        }
    } catch {
        return null;
    }
    return null;
}

export function parseOptionToFrac(text) {
    if (!text) return null;
    const s = String(text).replace(/^\$+|\$+$/g, "").trim();
    const m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);
    if (m) {
        const sign = m[1] === "-" ? -1 : 1;
        return new Frac(sign * Number(m[2]), Number(m[3]));
    }
    if (/^-?\d+$/.test(s)) {
        return new Frac(Number(s), 1);
    }
    return null;
}

export function solveEquation(text) {
    if (!text || typeof text !== "string") return null;

    const mathMatch = /\$([^$]+)\$/.exec(text);

    // Matches: x^2 - 5x = 0, x^2 = 25, 2x + 4 = 10, etc.
    const clean = (mathMatch ? mathMatch[1] : text)
        .replace(/^(Lös ekvationen|Bestäm lösningarna till ekvationen|Lös):\s*/i, "")
        .replace(/^\$+|\$+$/g, "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .trim();

    // 1. x^2 - a*x = 0  -> roots 0, a
    const quadFactored = /^x\^2\s*([+-])\s*(\d+)?x\s*=\s*0$/.exec(clean.replace(/\s+/g, ""));
    if (quadFactored) {
        const sign = quadFactored[1] === "-" ? 1 : -1;
        const coeff = quadFactored[2] ? Number(quadFactored[2]) : 1;
        const root2 = sign * coeff;
        return [0, root2].sort((a, b) => a - b).map(n => new Frac(n, 1));
    }

    // 2. x^2 = c  -> roots -sqrt(c), sqrt(c)
    const pureQuad = /^x\^2\s*=\s*(\d+)$/.exec(clean.replace(/\s+/g, ""));
    if (pureQuad) {
        const c = Number(pureQuad[1]);
        const root = Math.round(Math.sqrt(c));
        if (root * root === c) {
            return [new Frac(-root, 1), new Frac(root, 1)];
        }
    }

    // 3. x^2 - c = 0 -> roots -sqrt(c), sqrt(c)
    const pureQuadZero = /^x\^2\s*-\s*(\d+)\s*=\s*0$/.exec(clean.replace(/\s+/g, ""));
    if (pureQuadZero) {
        const c = Number(pureQuadZero[1]);
        const root = Math.round(Math.sqrt(c));
        if (root * root === c) {
            return [new Frac(-root, 1), new Frac(root, 1)];
        }
    }

    // 4. ax + b = c -> (c - b) / a
    const linear = /^([+-]?\d*)x\s*([+-]\s*\d+)?\s*=\s*([+-]?\d+)$/.exec(clean.replace(/\s+/g, ""));
    if (linear) {
        const aStr = linear[1];
        const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : Number(aStr);
        const b = linear[2] ? Number(linear[2].replace(/\s+/g, "")) : 0;
        const c = Number(linear[3]);
        if (a !== 0) {
            return [new Frac(c - b, a)];
        }
    }

    return null;
}

function parseLinearSystemLine(line) {
    const sides = line.replace(/\s+/g, "").split("=");
    if (sides.length !== 2) return null;

    const coefficients = { x: 0, y: 0, constant: 0 };
    for (const [side, multiplier] of [[sides[0], 1], [sides[1], -1]]) {
        const terms = side.match(/[+-]?[^+-]+/g) || [];
        for (const term of terms) {
            const variable = /([+-]?\d*)(x|y)$/.exec(term);
            if (variable) {
                const coefficient = variable[1] === "" || variable[1] === "+"
                    ? 1
                    : variable[1] === "-" ? -1 : Number(variable[1]);
                coefficients[variable[2]] += multiplier * coefficient;
            } else if (/^[+-]?\d+$/.test(term)) {
                coefficients.constant -= multiplier * Number(term);
            } else {
                return null;
            }
        }
    }

    return coefficients;
}

export function solveLinearSystem(text) {
    const casesMatch = /\\begin\{cases\}([\s\S]*?)\\end\{cases\}/.exec(String(text || ""));
    if (!casesMatch) return null;

    const equations = casesMatch[1]
        .split(/\\\\/)
        .map(line => parseLinearSystemLine(line))
        .filter(Boolean);
    if (equations.length !== 2) return null;

    const [first, second] = equations;
    const determinant = first.x * second.y - second.x * first.y;
    if (determinant === 0) return null;

    return [
        new Frac(first.constant * second.y - second.constant * first.y, determinant),
        new Frac(first.x * second.constant - second.x * first.constant, determinant)
    ];
}

function expressionSource(text) {
    const mathMatch = /\$([^$]+)\$/.exec(String(text || ""));
    return (mathMatch ? mathMatch[1] : String(text || ""))
        .replace(/\\left|\\right/g, "")
        .replace(/\\cdot|\\times/g, "*")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^[^=]*=\s*/, "")
        .replace(/(\d|[A-Za-z]|\))(?=\()/g, "$1*")
        .replace(/(\d)([A-Za-z])/g, "$1*$2")
        .replace(/\)(?=\()/g, ")*");
}

function polynomialAdd(left, right, sign = 1) {
    const result = new Map(left);
    for (const [key, value] of right) {
        const next = (result.get(key) || 0) + sign * value;
        if (next === 0) result.delete(key);
        else result.set(key, next);
    }
    return result;
}

function polynomialMultiply(left, right) {
    const result = new Map();
    for (const [leftKey, leftValue] of left) {
        for (const [rightKey, rightValue] of right) {
            const powers = {};
            for (const part of `${leftKey}|${rightKey}`.split("|")) {
                if (!part) continue;
                const [variable, exponent] = part.split(":");
                powers[variable] = (powers[variable] || 0) + Number(exponent);
            }
            const key = Object.entries(powers)
                .filter(([, exponent]) => exponent !== 0)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([variable, exponent]) => `${variable}:${exponent}`)
                .join("|");
            result.set(key, (result.get(key) || 0) + leftValue * rightValue);
        }
    }
    return result;
}

function polynomialPower(value, exponent) {
    if (!Number.isInteger(exponent) || exponent < 0) throw new Error("Unsupported exponent");
    let result = new Map([["", 1]]);
    for (let index = 0; index < exponent; index++) {
        result = polynomialMultiply(result, value);
    }
    return result;
}

function evaluatePolynomialNode(node) {
    if (node.isConstantNode) return new Map([["", Number(node.value)]]);
    if (node.isSymbolNode) return new Map([[`${node.name}:1`, 1]]);
    if (node.isParenthesisNode) return evaluatePolynomialNode(node.content);

    if (node.isOperatorNode && node.args.length === 1) {
        const value = evaluatePolynomialNode(node.args[0]);
        return node.op === "-" ? polynomialAdd(new Map(), value, -1) : value;
    }

    if (!node.isOperatorNode || node.args.length !== 2) {
        throw new Error("Unsupported expression node");
    }

    const left = evaluatePolynomialNode(node.args[0]);
    const right = evaluatePolynomialNode(node.args[1]);
    if (node.op === "+") return polynomialAdd(left, right);
    if (node.op === "-") return polynomialAdd(left, right, -1);
    if (node.op === "*") return polynomialMultiply(left, right);
    if (node.op === "^") {
        if (right.size !== 1 || !right.has("")) throw new Error("Unsupported exponent");
        return polynomialPower(left, [...right.values()][0]);
    }
    throw new Error("Unsupported operator");
}

function formatPolynomial(polynomial) {
    const terms = [...polynomial.entries()]
        .filter(([, coefficient]) => coefficient !== 0)
        .map(([key, coefficient]) => ({
            key,
            coefficient,
            degree: key ? key.split("|").reduce((sum, part) => sum + Number(part.split(":")[1]), 0) : 0
        }))
        .sort((left, right) => right.degree - left.degree || left.key.localeCompare(right.key));

    if (terms.length === 0) return "0";

    return terms.map(({ key, coefficient }, index) => {
        const variables = key
            ? key.split("|").map(part => {
                const [variable, exponent] = part.split(":");
                return exponent === "1" ? variable : `${variable}^${exponent}`;
            }).join("*")
            : "";
        const absolute = Math.abs(coefficient);
        const body = variables
            ? `${absolute === 1 ? "" : absolute}${variables}`
            : String(absolute);
        if (index === 0) return coefficient < 0 ? `-${body}` : body;
        return coefficient < 0 ? ` - ${body}` : ` + ${body}`;
    }).join("");
}

export function evaluateExpression(text) {
    try {
        return formatPolynomial(evaluatePolynomialNode(parseMathExpression(expressionSource(text))));
    } catch {
        return null;
    }
}

export function buildNumericDistractors(correctFrac, count = 3, existingKeys = new Set()) {
    const pool = [
        new Frac(correctFrac.n + correctFrac.d, correctFrac.d),   // +1
        new Frac(correctFrac.n - correctFrac.d, correctFrac.d),   // -1
        new Frac(-correctFrac.n, correctFrac.d),                  // sign flip
        new Frac(correctFrac.n + 2 * correctFrac.d, correctFrac.d), // +2
        new Frac(correctFrac.n - 2 * correctFrac.d, correctFrac.d), // -2
        new Frac(correctFrac.n + 3 * correctFrac.d, correctFrac.d),
        new Frac(correctFrac.n - 3 * correctFrac.d, correctFrac.d),
        new Frac(correctFrac.d, correctFrac.n === 0 ? 1 : correctFrac.n) // reciprocal
    ];

    const seen = new Set([...existingKeys, correctFrac.toKey()]);
    const distractors = [];

    for (const item of pool) {
        if (item.d === 0) continue;
        const k = item.toKey();
        if (!seen.has(k)) {
            seen.add(k);
            distractors.push(item);
            if (distractors.length >= count) break;
        }
    }

    let bump = 4;
    while (distractors.length < count) {
        const item = new Frac(correctFrac.n + bump * correctFrac.d, correctFrac.d);
        const k = item.toKey();
        if (!seen.has(k)) {
            seen.add(k);
            distractors.push(item);
        }
        bump++;
    }

    return distractors;
}

function formatFracOption(frac) {
    if (frac.d === 1) return `$${frac.n}$`;
    return `$${frac.toDisplay()}$`;
}

function parseAnswerConfig(answerConfig) {
    if (typeof answerConfig === "string") {
        try {
            return JSON.parse(answerConfig || "{}");
        } catch {
            return {};
        }
    }

    return answerConfig || {};
}

function buildAnswerConfig(questionType, options, currentConfig) {
    if (!["numeric_input", "equation", "expression", "factorization", "text"].includes(questionType)) {
        return null;
    }

    const correctAnswers = options
        .filter(option => option.is_correct)
        .map(option => option.text)
        .filter(answer => String(answer ?? "").trim() !== "");

    if (correctAnswers.length === 0) return null;

    const answerConfig = { ...currentConfig };
    if (
        answerConfig.default_answer === undefined ||
        answerConfig.default_answer === null ||
        String(answerConfig.default_answer).trim() === ""
    ) {
        answerConfig.default_answer = correctAnswers[0];
    }

    if (questionType === "numeric_input" || questionType === "equation") {
        if (JSON.stringify(answerConfig.correctAnswers || []) !== JSON.stringify(correctAnswers)) {
            answerConfig.correctAnswers = correctAnswers;
        }
        if (correctAnswers.length > 1) {
            answerConfig.order_independent = true;
        }
    }

    return answerConfig;
}

function answerConfigChanged(currentConfig, nextConfig) {
    return JSON.stringify(currentConfig) !== JSON.stringify(nextConfig);
}

/**
 * Auto-fixes a single question in the database.
 */
export async function autoFixQuestion(questionId, userId = 1) {
    const [[question]] = await db.query(
        `
        SELECT q.*, b.title AS block_title
        FROM questions q
        JOIN blocks b ON b.id = q.block_id
        WHERE q.id = ?
        AND q.deleted_at IS NULL AND q.archived_at IS NULL
        AND b.deleted_at IS NULL AND b.archived_at IS NULL
        `,
        [questionId]
    );

    if (!question) {
        return {
            success: false,
            message: "Frågan hittades inte eller är arkiverad/borttagen."
        };
    }

    const [options] = await db.query(
        `
        SELECT *
        FROM options
        WHERE question_id = ?
        AND deleted_at IS NULL
        ORDER BY id
        `,
        [questionId]
    );

    const changes = [];
    const systemAnswers = solveLinearSystem(question.question);

    if (systemAnswers) {
        const usedOptionIds = new Set();
        for (const answer of systemAnswers) {
            const matchingOption = options.find(option => {
                const parsed = parseOptionToFrac(option.text);
                return parsed && parsed.toKey() === answer.toKey() && !usedOptionIds.has(option.id);
            });

            if (matchingOption) {
                usedOptionIds.add(matchingOption.id);
                if (!matchingOption.is_correct) {
                    await db.query(
                        `UPDATE options SET is_correct = 1, updated_by = ?, updated_at = NOW() WHERE id = ?`,
                        [userId, matchingOption.id]
                    );
                    matchingOption.is_correct = 1;
                    changes.push(`Markerade systemsvaret ${matchingOption.text} som korrekt.`);
                }
            } else {
                const newText = answer.toDisplay();
                const [res] = await db.query(
                    `INSERT INTO options (question_id, text, is_correct, created_by, updated_by) VALUES (?, ?, 1, ?, ?)`,
                    [question.id, newText, userId, userId]
                );
                options.push({ id: res.insertId, question_id: question.id, text: newText, is_correct: 1 });
                usedOptionIds.add(res.insertId);
                changes.push(`Lade till systemsvaret ${newText} som korrekt.`);
            }
        }

        for (const option of options) {
            if (option.is_correct && !usedOptionIds.has(option.id)) {
                await db.query(
                    `UPDATE options SET is_correct = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
                    [userId, option.id]
                );
                option.is_correct = 0;
                changes.push(`Avmarkerade felaktigt systemsvar ${option.text}.`);
            }
        }
    }

    // 1. Check if arithmetic / equation evaluation gives a solution
    const arithmeticResult = evaluateArithmetic(question.question);
    const equationRoots = solveEquation(question.question);
    const expressionResult = question.question_type === "expression"
        ? evaluateExpression(question.question)
        : null;
    const factorizationResult = question.question_type === "factorization"
        ? factorizeExpression(question.question, parseMathExpression)
        : null;

    let calculatedCorrectFrac = arithmeticResult;
    if (!calculatedCorrectFrac && equationRoots && equationRoots.length === 1) {
        calculatedCorrectFrac = equationRoots[0];
    }

    // A. Fix missing correct solution
    const currentCorrectOptions = options.filter(o => o.is_correct);

    if (currentCorrectOptions.length === 0) {
        if (calculatedCorrectFrac) {
            // Check if one of the existing options matches the computed value
            let matchedOption = null;
            for (const opt of options) {
                const optFrac = parseOptionToFrac(opt.text);
                if (optFrac && optFrac.toKey() === calculatedCorrectFrac.toKey()) {
                    matchedOption = opt;
                    break;
                }
            }

            if (matchedOption) {
                await db.query(
                    `UPDATE options SET is_correct = 1, updated_by = ?, updated_at = NOW() WHERE id = ?`,
                    [userId, matchedOption.id]
                );
                matchedOption.is_correct = 1;
                changes.push(`Markerade alternativ "${matchedOption.text}" som rätt svar (${calculatedCorrectFrac.toDisplay()}).`);
            } else if (options.length > 0) {
                // Replace the first or last distractor with the correct answer
                const targetOpt = options[0];
                const newText = formatFracOption(calculatedCorrectFrac);
                await db.query(
                    `UPDATE options SET text = ?, is_correct = 1, updated_by = ?, updated_at = NOW() WHERE id = ?`,
                    [newText, userId, targetOpt.id]
                );
                targetOpt.text = newText;
                targetOpt.is_correct = 1;
                changes.push(`Ersatte alternativ med korrekt svar: ${newText}.`);
            } else if (
                question.question_type === "numeric_input" ||
                question.question_type === "equation" ||
                question.question_type === "expression" ||
                question.question_type === "factorization" ||
                question.question_type === "text"
            ) {
                const newText = calculatedCorrectFrac.toDisplay();
                const [res] = await db.query(
                    `INSERT INTO options (question_id, text, is_correct, created_by, updated_by) VALUES (?, ?, 1, ?, ?)`,
                    [question.id, newText, userId, userId]
                );
                options.push({ id: res.insertId, question_id: question.id, text: newText, is_correct: 1 });
                changes.push(`Lade till facit ${newText}.`);
            }
        } else if (equationRoots && equationRoots.length > 1) {
            if (options.length === 0) {
                for (const root of equationRoots) {
                    const newText = root.toDisplay();
                    const [res] = await db.query(
                        `INSERT INTO options (question_id, text, is_correct, created_by, updated_by) VALUES (?, ?, 1, ?, ?)`,
                        [question.id, newText, userId, userId]
                    );
                    options.push({ id: res.insertId, question_id: question.id, text: newText, is_correct: 1 });
                }
                changes.push(`Lade till rötterna (${equationRoots.map(r => r.toDisplay()).join(", ")}) som facit.`);
            } else {
                // If options already exist, mark matching roots as correct
                for (const opt of options) {
                    const optFrac = parseOptionToFrac(opt.text);
                    if (optFrac && equationRoots.some(r => r.toKey() === optFrac.toKey())) {
                        await db.query(`UPDATE options SET is_correct = 1, updated_by = ?, updated_at = NOW() WHERE id = ?`, [userId, opt.id]);
                        opt.is_correct = 1;
                        changes.push(`Markerade rot ${opt.text} som rätt svar.`);
                    }
                }
            }
        } else if (expressionResult) {
            const [res] = await db.query(
                `INSERT INTO options (question_id, text, is_correct, created_by, updated_by) VALUES (?, ?, 1, ?, ?)`,
                [question.id, expressionResult, userId, userId]
            );
            options.push({ id: res.insertId, question_id: question.id, text: expressionResult, is_correct: 1 });
            changes.push(`Lade till facit ${expressionResult}.`);
        } else if (factorizationResult) {
            const [res] = await db.query(
                `INSERT INTO options (question_id, text, is_correct, created_by, updated_by) VALUES (?, ?, 1, ?, ?)`,
                [question.id, factorizationResult, userId, userId]
            );
            options.push({ id: res.insertId, question_id: question.id, text: factorizationResult, is_correct: 1 });
            changes.push(`Lade till faktoriserat facit ${factorizationResult}.`);
        } else if (options.length > 0) {
            // Fallback: if no math evaluation, mark first option as correct
            const firstOpt = options[0];
            await db.query(`UPDATE options SET is_correct = 1, updated_by = ?, updated_at = NOW() WHERE id = ?`, [userId, firstOpt.id]);
            firstOpt.is_correct = 1;
            changes.push(`Markerade första alternativet "${firstOpt.text}" som rätt svar.`);
        }
    }

    if (options.some(option => option.is_correct)) {
        const currentAnswerConfig = parseAnswerConfig(question.answer_config);
        const answerConfig = buildAnswerConfig(
            question.question_type,
            options,
            currentAnswerConfig
        );

        if (answerConfig && answerConfigChanged(currentAnswerConfig, answerConfig)) {
            await db.query(
                `
                UPDATE questions
                SET answer_config = ?, updated_by = ?, updated_at = NOW()
                WHERE id = ?
                `,
                [JSON.stringify(answerConfig), userId, question.id]
            );
            changes.push("Lade till svaret i frågans svarskonfiguration.");
        }
    }

    // B. Fix duplicate options / options sharing value with correct answer
    const optionCheck = checkOptionValues(options);
    if (!optionCheck.valid && options.length > 1) {
        const correctOpt = options.find(o => o.is_correct);
        const correctFrac = correctOpt ? parseOptionToFrac(correctOpt.text) : calculatedCorrectFrac;

        const seenKeys = new Set();
        if (correctFrac) {
            seenKeys.add(correctFrac.toKey());
        }

        for (const opt of options) {
            if (opt.is_correct) continue;

            const optFrac = parseOptionToFrac(opt.text);
            const key = optFrac ? optFrac.toKey() : opt.text.trim();

            if (seenKeys.has(key)) {
                // Generate a replacement distractor
                let replacementText;
                if (correctFrac) {
                    const distractors = buildNumericDistractors(correctFrac, 5, seenKeys);
                    const chosen = distractors.find(d => !seenKeys.has(d.toKey())) || distractors[0];
                    seenKeys.add(chosen.toKey());
                    replacementText = formatFracOption(chosen);
                } else if (optFrac) {
                    const distractors = buildNumericDistractors(optFrac, 5, seenKeys);
                    const chosen = distractors.find(d => !seenKeys.has(d.toKey())) || distractors[0];
                    seenKeys.add(chosen.toKey());
                    replacementText = formatFracOption(chosen);
                } else {
                    replacementText = `${opt.text}_alt`;
                    seenKeys.add(replacementText);
                }

                await db.query(
                    `UPDATE options SET text = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
                    [replacementText, userId, opt.id]
                );
                changes.push(`Ändrade dubblettalternativ från "${opt.text}" till "${replacementText}".`);
                opt.text = replacementText;
            } else {
                seenKeys.add(key);
            }
        }
    }

    // C. Clean up legacy numeric input markers
    if (question.question_type === "numeric_input") {
        const updatedCorrectCount = options.filter(o => o.is_correct).length;
        let syncedText = syncNumericInputs(question.question, updatedCorrectCount);
        const markerCount = (syncedText.match(/\{\{input\}\}/g) || []).length;
        if (markerCount < updatedCorrectCount) {
            syncedText = `${syncedText}\n${"{{input}}\n".repeat(updatedCorrectCount - markerCount).trim()}`.trim();
        }

        if (updatedCorrectCount > 0 && syncedText !== (question.question || "")) {
            let answerConfig = {};
            try {
                answerConfig = typeof question.answer_config === "string"
                    ? JSON.parse(question.answer_config)
                    : (question.answer_config || {});
            } catch {
                answerConfig = {};
            }

            if (updatedCorrectCount > 1) {
                answerConfig.order_independent = true;
            }

            await db.query(
                `
                UPDATE questions
                SET question = ?,
                    answer_config = ?,
                    updated_by = ?,
                    updated_at = NOW()
                WHERE id = ?
                `,
                [syncedText, JSON.stringify(answerConfig), userId, question.id]
            );

            changes.push("Tog bort gamla svarsrutemarkörer från frågetexten.");
        }
    }

    // D. Clear question reports
    await db.query(
        `DELETE FROM question_reports WHERE question_id = ?`,
        [question.id]
    );

    return {
        success: true,
        fixed: changes.length > 0,
        changes
    };
}

/**
 * Auto-fixes multiple questions across blocks.
 */
export async function autoFixMultipleQuestions(questionIds = [], userId = 1) {
    if (!questionIds || questionIds.length === 0) {
        return { totalChecked: 0, totalFixed: 0, results: [] };
    }

    let totalFixed = 0;
    const results = [];

    for (const qid of questionIds) {
        try {
            const res = await autoFixQuestion(qid, userId);
            if (res.fixed) {
                totalFixed++;
            }
            results.push({
                questionId: qid,
                ...res
            });
        } catch (err) {
            results.push({
                questionId: qid,
                success: false,
                message: err.message
            });
        }
    }

    return {
        totalChecked: questionIds.length,
        totalFixed,
        results
    };
}

