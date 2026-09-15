class Fraction {
    constructor(numerator, denominator = 1) {
        if (denominator === 0) throw new Error("Division by zero");
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }
        const divisor = Fraction.gcd(Math.abs(numerator), denominator) || 1;
        this.numerator = numerator / divisor;
        this.denominator = denominator / divisor;
    }

    static gcd(a, b) {
        return b === 0 ? a : Fraction.gcd(b, a % b);
    }

    add(other) {
        return new Fraction(this.numerator * other.denominator + other.numerator * this.denominator, this.denominator * other.denominator);
    }

    subtract(other) {
        return new Fraction(this.numerator * other.denominator - other.numerator * this.denominator, this.denominator * other.denominator);
    }

    multiply(other) {
        return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
    }

    divide(other) {
        return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
    }

    power(exponent) {
        let result = new Fraction(1);
        for (let index = 0; index < exponent; index++) result = result.multiply(this);
        return result;
    }

    equals(other) {
        return this.numerator === other.numerator && this.denominator === other.denominator;
    }

    toString() {
        return this.denominator === 1 ? String(this.numerator) : `${this.numerator}/${this.denominator}`;
    }
}

function evaluateArithmetic(expression) {
    const source = String(expression || "")
        .replace(/^\$+|\$+$/g, "")
        .replace(/\\left|\\right/g, "")
        .replace(/[−–—]/g, "-")
        .replace(/\\cdot|\\times/g, "*")
        .replace(/\\div/g, "/")
        .trim();
    let position = 0;

    const skipWhitespace = () => {
        while (/\s/.test(source[position] || "")) position++;
    };

    const parseBraced = () => {
        skipWhitespace();
        if (source[position] !== "{") throw new Error("Invalid group");
        position++;
        const value = parseExpression();
        skipWhitespace();
        if (source[position] !== "}") throw new Error("Invalid group");
        position++;
        return value;
    };

    const applyPower = value => {
        skipWhitespace();
        if (source[position] !== "^") return value;
        position++;
        const exponent = /^\d+/.exec(source.slice(position));
        if (!exponent) throw new Error("Invalid exponent");
        position += exponent[0].length;
        return value.power(Number(exponent[0]));
    };

    const parseFactor = () => {
        skipWhitespace();
        if (source.startsWith("\\frac", position)) {
            position += 5;
            return parseBraced().divide(parseBraced());
        }
        if (source[position] === "(") {
            position++;
            const value = parseExpression();
            skipWhitespace();
            if (source[position] !== ")") throw new Error("Invalid parentheses");
            position++;
            return applyPower(value);
        }
        if (source[position] === "-") {
            position++;
            return new Fraction(-1).multiply(parseFactor());
        }
        const number = /^\d+/.exec(source.slice(position));
        if (!number) throw new Error("Unsupported expression");
        position += number[0].length;
        return applyPower(new Fraction(Number(number[0])));
    };

    const parseTerm = () => {
        let value = parseFactor();
        skipWhitespace();
        while (["*", "/"].includes(source[position])) {
            const operator = source[position++];
            const right = parseFactor();
            value = operator === "*" ? value.multiply(right) : value.divide(right);
            skipWhitespace();
        }
        return value;
    };

    function parseExpression() {
        let value = parseTerm();
        skipWhitespace();
        while (["+", "-"].includes(source[position])) {
            const operator = source[position++];
            const right = parseTerm();
            value = operator === "+" ? value.add(right) : value.subtract(right);
            skipWhitespace();
        }
        return value;
    }

    const result = parseExpression();
    skipWhitespace();
    if (position !== source.length) throw new Error("Unsupported expression");
    return [result];
}

function solveFactorizedEquation(question) {
    const source = String(question || "").replace(/\\left|\\right/g, "").replace(/[−–—]/g, "-").replace(/\s+/g, "");
    const equation = source.match(/([0-9xX()+\-]+)=0/);
    if (!equation) return null;

    const leftSide = equation[1];
    const factors = leftSide.match(/\([^()]+\)|x/gi);
    if (!factors || factors.join("") !== leftSide) return null;

    return factors.map(factor => {
        const linear = factor.replace(/^\(|\)$/g, "");
        const match = /^([+-]?\d*)x([+-]\d+)?$/i.exec(linear);
        if (!match) throw new Error("Unsupported factor");
        const coefficient = match[1] === "" || match[1] === "+"
            ? 1
            : match[1] === "-" ? -1 : Number(match[1]);
        return new Fraction(-Number(match[2] || 0), coefficient);
    });
}

function solveShiftedSquareEquation(question) {
    const source = String(question || "")
        .replace(/\\left|\\right/g, "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/\s+/g, "");
    const equation = /([+-]?\d+(?:[.,]\d+)?)?\(x([+-]\d+(?:[.,]\d+)?)\)\^2=([-+]?\d+(?:[.,]\d+)?)$/.exec(source);
    if (!equation) return null;

    const coefficient = Number((equation[1] || "1").replace(",", "."));
    const offset = Number(equation[2].replace(",", "."));
    const rightSide = Number(equation[3].replace(",", "."));
    if (coefficient === 0 || rightSide / coefficient < 0) return null;

    const squareRoot = Math.sqrt(rightSide / coefficient);
    return [
        new Fraction(Math.round((-offset - squareRoot) * 1000000), 1000000),
        new Fraction(Math.round((-offset + squareRoot) * 1000000), 1000000)
    ];
}

function solvePolynomialEquation(question) {
    const rawSource = String(question || "")
        .replace(/\\left|\\right/g, "")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/\s+/g, "");
    const equation = rawSource.match(/([0-9xX+\-^.,]+)=([-+]?\d+(?:[.,]\d+)?)/);
    if (!equation) return null;
    const source = equation[1];
    if (!source.includes("x") || !/^[0-9xX+\-^.,]+$/.test(source)) return null;

    const coefficients = {};
    const terms = source.match(/[+-]?[^+-]+/g);
    if (!terms) return null;

    for (const term of terms) {
        const variable = /^([+-]?(?:\d+(?:[.,]\d+)?)?)x(?:\^(\d+))?$/i.exec(term);
        const constant = /^([+-]?\d+(?:[.,]\d+)?)$/.exec(term);
        if (variable) {
            const coefficient = variable[1] === "" || variable[1] === "+"
                ? 1
                : variable[1] === "-" ? -1 : Number(variable[1].replace(",", "."));
            const power = Number(variable[2] || 1);
            coefficients[power] = (coefficients[power] || 0) + coefficient;
        } else if (constant) {
            coefficients[0] = (coefficients[0] || 0) + Number(constant[1].replace(",", "."));
        } else {
            return null;
        }
    }

    coefficients[0] = (coefficients[0] || 0) - Number(equation[2].replace(",", "."));

    const degree = Math.max(...Object.keys(coefficients).map(Number));
    if (degree < 1 || degree > 3) return null;
    const values = Array.from({ length: degree + 1 }, (_, power) => coefficients[power] || 0);
    const leading = values[degree];
    const constant = values[0];
    if (degree === 2) {
        const discriminant = values[1] ** 2 - 4 * leading * constant;
        if (discriminant < 0) return null;
        const squareRoot = Math.sqrt(discriminant);
        return [
            new Fraction(Math.round((-values[1] - squareRoot) * 1000000), Math.round(2 * leading * 1000000)),
            new Fraction(Math.round((-values[1] + squareRoot) * 1000000), Math.round(2 * leading * 1000000))
        ];
    }
    const divisors = number => {
        const result = [];
        for (let value = 1; value <= Math.abs(number); value++) {
            if (number % value === 0) result.push(value);
        }
        return result;
    };
    const candidates = constant === 0
        ? [new Fraction(0)]
        : divisors(constant).flatMap(numerator =>
            divisors(leading).flatMap(denominator => [
                new Fraction(numerator, denominator),
                new Fraction(-numerator, denominator)
            ])
        );
    const evaluate = root => values.reduce(
        (sum, coefficient, power) => sum.add(new Fraction(coefficient).multiply(root.power(power))),
        new Fraction(0)
    );
    const root = candidates.find(candidate => evaluate(candidate).equals(new Fraction(0)));
    if (!root) return null;
    if (degree === 1) return [root];

    let carry = values[degree];
    const divided = [carry];
    for (let power = degree - 1; power >= 1; power--) {
        carry = values[power] + carry * root.numerator / root.denominator;
        divided.push(carry);
    }
    const [a, b, c] = divided;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [root];
    const squareRoot = Math.sqrt(discriminant);
    return [
        root,
        new Fraction(Math.round((-b + squareRoot) * 1000000), Math.round(a * 2 * 1000000)),
        new Fraction(Math.round((-b - squareRoot) * 1000000), Math.round(a * 2 * 1000000))
    ];
}

function parseValue(value) {
    const source = String(value || "").replace(/^\$+|\$+$/g, "").trim();
    const fraction = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(source);
    if (fraction) return new Fraction((fraction[1] ? -1 : 1) * Number(fraction[2]), Number(fraction[3]));
    const slashFraction = /^(-?\d+)\/(\d+)$/.exec(source);
    if (slashFraction) return new Fraction(Number(slashFraction[1]), Number(slashFraction[2]));
    const decimal = /^(-?)(\d+)[,.](\d+)$/.exec(source);
    if (decimal) {
        const digits = `${decimal[2]}${decimal[3]}`;
        const sign = decimal[1] === "-" ? -1 : 1;
        return new Fraction(sign * Number(digits), 10 ** decimal[3].length);
    }
    if (/^-?\d+$/.test(source)) return new Fraction(Number(source));
    return null;
}

export function checkImportedAnswerKey({ question, questionType, options, answerConfig }) {
    if (questionType === "text") return null;

    const expectedValues = solveShiftedSquareEquation(question) ||
        solveFactorizedEquation(question) ||
        solvePolynomialEquation(question) ||
        evaluateArithmetic(question);
    const correctOptions = (options || []).filter(option => option.isCorrect);
    const correctValues = correctOptions.map(option => parseValue(option.text));

    if (correctValues.length === 0 || correctValues.some(value => !value)) {
        const defaultAnswer = parseValue(answerConfig?.default_answer);
        return defaultAnswer && expectedValues.length === 1 && expectedValues[0].equals(defaultAnswer);
    }

    return expectedValues.every(expected => correctValues.some(value => expected.equals(value))) &&
        correctValues.every(value => expectedValues.some(expected => expected.equals(value)));
}
