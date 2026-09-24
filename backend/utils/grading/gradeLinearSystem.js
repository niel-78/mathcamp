import { compareNumeric } from "./gradeNumeric.js";

function parseValues(studentAnswer) {
    if (typeof studentAnswer === "string") {
        try {
            studentAnswer = JSON.parse(studentAnswer);
        } catch {
            return null;
        }
    }

    return Array.isArray(studentAnswer) ? studentAnswer : null;
}

export function gradeLinearSystem(studentAnswer, config = {}) {
    const values = parseValues(studentAnswer);
    const variables = Array.isArray(config.variables) ? config.variables : [];

    if (!values || variables.length === 0 || values.length !== variables.length) {
        return false;
    }

    if (config.require_distinct_values) {
        for (let index = 0; index < values.length; index++) {
            for (let otherIndex = index + 1; otherIndex < values.length; otherIndex++) {
                if (compareNumeric(values[index], values[otherIndex], config)) {
                    return false;
                }
            }
        }
    }

    return variables.every((variable, index) =>
        compareNumeric(values[index], variable.answer, config)
    );
}

export function scoreLinearSystem(studentAnswer, config = {}) {
    const values = parseValues(studentAnswer);
    const variables = Array.isArray(config.variables) ? config.variables : [];
    const matches = values && variables.length === values.length
        ? variables.map((variable, index) => compareNumeric(values[index], variable.answer, config))
        : [];
    const distinct = !config.require_distinct_values || !values || values.every((value, index) =>
        values.slice(index + 1).every(otherValue => !compareNumeric(value, otherValue, config))
    );
    const correct = distinct && matches.length === variables.length && matches.every(Boolean);

    return {
        correct,
        correctCount: matches.filter(Boolean).length,
        totalCount: variables.length,
        pointsFraction: variables.length ? matches.filter(Boolean).length / variables.length : 0,
        masteryMultiplier: correct ? 1 : -1
    };
}
