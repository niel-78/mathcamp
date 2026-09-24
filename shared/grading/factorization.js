const gcd = (left, right) => {
    let a = Math.abs(left);
    let b = Math.abs(right);

    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a || 1;
};

const unwrap = node =>
    node?.isParenthesisNode ? unwrap(node.content) : node;

const mergeVariables = (left, right) => {
    if (left && right && left !== right) {
        throw new Error("Only one-variable polynomials are supported");
    }

    return left || right || null;
};

const addPolynomials = (left, right, sign = 1) => {
    const coefficients = new Map(left.coefficients);

    for (const [degree, coefficient] of right.coefficients) {
        const next = (coefficients.get(degree) || 0) + sign * coefficient;
        if (next === 0) coefficients.delete(degree);
        else coefficients.set(degree, next);
    }

    return {
        coefficients,
        variable: mergeVariables(left.variable, right.variable)
    };
};

const multiplyPolynomials = (left, right) => {
    const coefficients = new Map();

    for (const [leftDegree, leftCoefficient] of left.coefficients) {
        for (const [rightDegree, rightCoefficient] of right.coefficients) {
            const degree = leftDegree + rightDegree;
            coefficients.set(
                degree,
                (coefficients.get(degree) || 0) +
                    leftCoefficient * rightCoefficient
            );
        }
    }

    return {
        coefficients,
        variable: mergeVariables(left.variable, right.variable)
    };
};

const powerPolynomial = (polynomial, exponent) => {
    if (!Number.isInteger(exponent) || exponent < 0) {
        throw new Error("Unsupported exponent");
    }

    let result = {
        coefficients: new Map([[0, 1]]),
        variable: polynomial.variable
    };

    for (let index = 0; index < exponent; index++) {
        result = multiplyPolynomials(result, polynomial);
    }

    return result;
};

const polynomialFromNode = inputNode => {
    const node = unwrap(inputNode);

    if (node?.isConstantNode) {
        const value = Number(node.value);
        if (!Number.isInteger(value)) throw new Error("Only integer coefficients are supported");
        return { coefficients: new Map([[0, value]]), variable: null };
    }

    if (node?.isSymbolNode) {
        return { coefficients: new Map([[1, 1]]), variable: node.name };
    }

    if (!node?.isOperatorNode) {
        throw new Error("Unsupported expression");
    }

    if (node.args.length === 1) {
        const value = polynomialFromNode(node.args[0]);
        return node.op === "-"
            ? {
                coefficients: new Map(
                    [...value.coefficients].map(([degree, coefficient]) => [degree, -coefficient])
                ),
                variable: value.variable
            }
            : value;
    }

    if (node.op === "^") {
        const exponentNode = unwrap(node.args[1]);
        if (!exponentNode?.isConstantNode) throw new Error("Unsupported exponent");
        return powerPolynomial(
            polynomialFromNode(node.args[0]),
            Number(exponentNode.value)
        );
    }

    const left = polynomialFromNode(node.args[0]);
    const right = polynomialFromNode(node.args[1]);

    if (node.op === "+") return addPolynomials(left, right);
    if (node.op === "-") return addPolynomials(left, right, -1);
    if (node.op === "*") return multiplyPolynomials(left, right);

    throw new Error("Unsupported operator");
};

const degreeOf = coefficients =>
    Math.max(...coefficients.keys(), 0);

const coefficientArray = coefficients => {
    const degree = degreeOf(coefficients);
    return Array.from(
        { length: degree + 1 },
        (_, index) => coefficients.get(index) || 0
    );
};

const evaluateCoefficients = (coefficients, value) =>
    coefficients.reduceRight(
        (result, coefficient) => result * value + coefficient,
        0
    );

const divisors = value => {
    const absolute = Math.abs(value);
    const result = [];

    for (let candidate = 1; candidate <= absolute; candidate++) {
        if (absolute % candidate === 0) {
            result.push(candidate, -candidate);
        }
    }

    return result;
};

const divideByRoot = (coefficients, root) => {
    const degree = coefficients.length - 1;
    const quotient = Array(degree).fill(0);
    quotient[degree - 1] = coefficients[degree];

    for (let index = degree - 1; index >= 1; index--) {
        quotient[index - 1] = coefficients[index] + root * quotient[index];
    }

    return quotient;
};

const formatPolynomial = (coefficients, variable) => {
    const terms = [];

    for (let degree = coefficients.length - 1; degree >= 0; degree--) {
        const coefficient = coefficients[degree];
        if (coefficient === 0) continue;

        const absolute = Math.abs(coefficient);
        const variablePart = degree === 0
            ? ""
            : degree === 1 ? variable : `${variable}^${degree}`;
        const body = variablePart
            ? `${absolute === 1 ? "" : absolute}${variablePart}`
            : String(absolute);

        if (terms.length === 0) terms.push(coefficient < 0 ? `-${body}` : body);
        else terms.push(coefficient < 0 ? ` - ${body}` : ` + ${body}`);
    }

    return terms.join("") || "0";
};

const factorPolynomial = polynomial => {
    const variable = polynomial.variable || "x";
    const original = coefficientArray(polynomial.coefficients);
    const nonZero = original.filter(coefficient => coefficient !== 0);

    if (nonZero.length === 0) {
        return { expression: "0", didFactor: false };
    }

    let content = nonZero.reduce((result, coefficient) => gcd(result, coefficient), 0);
    const leading = original[original.length - 1];
    if (leading < 0) content *= -1;

    let minimumDegree = original.findIndex(coefficient => coefficient !== 0);
    let coefficients = original
        .slice(minimumDegree)
        .map(coefficient => coefficient / content);
    const roots = [];

    while (coefficients.length > 2 && coefficients[0] !== 0) {
        const root = divisors(coefficients[0])
            .find(candidate => evaluateCoefficients(coefficients, candidate) === 0);

        if (root === undefined) break;
        roots.push(root);
        coefficients = divideByRoot(coefficients, root);
    }

    const didFactor =
        Math.abs(content) !== 1 ||
        minimumDegree > 0 ||
        roots.length > 0;

    if (!didFactor) {
        return {
            expression: formatPolynomial(original, variable),
            didFactor: false
        };
    }

    const factors = [];
    if (content === -1) factors.push("-");
    else if (content !== 1) factors.push(String(content));

    if (minimumDegree > 0) {
        factors.push(minimumDegree === 1 ? variable : `${variable}^${minimumDegree}`);
    }

    for (const root of roots) {
        factors.push(`(${variable}${root < 0 ? "+" : "-"}${Math.abs(root)})`);
    }

    if (coefficients.length > 1) {
        factors.push(`(${formatPolynomial(coefficients, variable)})`);
    } else if (coefficients[0] !== 1) {
        factors.push(String(coefficients[0]));
    }

    return {
        expression: factors.join(""),
        didFactor: true
    };
};

export const normalizeFactorizationSource = text => {
    const source = String(text || "");
    const mathMatch = /\$([^$]+)\$/.exec(source);

    return (mathMatch ? mathMatch[1] : source)
        .replace(/\\left|\\right/g, "")
        .replace(/\\cdot|\\times/g, "*")
        .replace(/[−–—]/g, "-")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/\^\{(-?\d+)\}/g, "^($1)")
        .replace(/(\d|[A-Za-z]|\))(?=\()/g, "$1*")
        .trim();
};

export const factorizeExpression = (text, parseExpression) => {
    try {
        const node = parseExpression(normalizeFactorizationSource(text));
        return factorPolynomial(polynomialFromNode(node)).expression;
    } catch {
        return null;
    }
};

const flattenProduct = inputNode => {
    const node = unwrap(inputNode);
    if (node?.isOperatorNode && node.op === "*" && node.args.length === 2) {
        return [
            ...flattenProduct(node.args[0]),
            ...flattenProduct(node.args[1])
        ];
    }
    return [node];
};

const isReducibleAdditiveFactor = node => {
    const value = unwrap(node);
    if (!value?.isOperatorNode || !["+", "-"].includes(value.op) || value.args.length !== 2) {
        return false;
    }

    return factorPolynomial(polynomialFromNode(value)).didFactor;
};

export const scoreFactorization = ({
    studentAnswer,
    correctAnswer,
    parseExpression,
    equivalent
}) => {
    if (!studentAnswer || !correctAnswer || !equivalent(studentAnswer, correctAnswer)) {
        return {
            correct: false,
            pointsFraction: 0,
            masteryMultiplier: -1
        };
    }

    try {
        const correctPolynomial = polynomialFromNode(
            parseExpression(normalizeFactorizationSource(correctAnswer))
        );
        const correctNeedsFactoring = factorPolynomial(correctPolynomial).didFactor;

        if (!correctNeedsFactoring) {
            return {
                correct: true,
                pointsFraction: 1,
                masteryMultiplier: 1
            };
        }

        const studentNode = parseExpression(
            normalizeFactorizationSource(studentAnswer)
        );
        const factors = flattenProduct(studentNode);
        const hasFactorization = factors.length > 1;

        if (!hasFactorization) {
            return {
                correct: false,
                pointsFraction: 0,
                masteryMultiplier: -1
            };
        }

        const fullyFactored = !factors.some(isReducibleAdditiveFactor);

        return fullyFactored
            ? {
                correct: true,
                pointsFraction: 1,
                masteryMultiplier: 1
            }
            : {
                correct: false,
                pointsFraction: 0.5,
                masteryMultiplier: 0
            };
    } catch {
        return {
            correct: false,
            pointsFraction: 0,
            masteryMultiplier: -1
        };
    }
};
