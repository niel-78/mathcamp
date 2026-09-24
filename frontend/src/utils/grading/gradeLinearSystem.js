import { compareNumeric } from "./gradeNumeric";

export function scoreLinearSystem(studentAnswer, config = {}) {
    let values = studentAnswer;
    if (typeof values === "string") {
        try {
            values = JSON.parse(values);
        } catch {
            values = null;
        }
    }

    const variables = Array.isArray(config.variables) ? config.variables : [];
    const matches = Array.isArray(values) && values.length === variables.length
        ? variables.map((variable, index) => compareNumeric(values[index], variable.answer, config))
        : [];
    const distinct = !config.require_distinct_values || !values || values.every((value, index) =>
        values.slice(index + 1).every(otherValue => !compareNumeric(value, otherValue, config))
    );
    const correct = distinct && matches.length === variables.length && matches.every(Boolean);

    return {
        correct,
        pointsFraction: variables.length ? matches.filter(Boolean).length / variables.length : 0
    };
}
