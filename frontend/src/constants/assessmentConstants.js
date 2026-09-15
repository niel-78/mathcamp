export const QUESTION_TYPES = {
    TEXT: {
        value: "text",
        label: "Textsvar"
    },
    SINGLE_CHOICE: {
        value: "single_choice",
        label: "Enval"
    },
    MULTIPLE_CHOICE: {
        value: "multiple_choice",
        label: "Flerval"
    },
    NUMERIC_INPUT: {
        value: "numeric_input",
        label: "Numerisk(a) svarsruta(or)"
    }
};

// Marker used in the question text to place an answer input box, e.g. "x = {{input}}"
export const NUMERIC_INPUT_MARKER = "{{input}}";
export const ANSWER_FORMATS = {
    ALL: {
        value: "all",
        label: "Alla"
    },
    DECIMAL: {
        value: "decimal",
        label: "Decimalform"
    },
    PERCENT: {
        value: "percent",
        label: "Procentform"
    },
    FRACTION: {
        value: "fraction",
        label: "Bråkform"
    }
};

export const GRADING_MODES = {
    TEXT: {
        value: "text",
        label: "Text",
        settings: [
            "default_answer"
        ]
    },
    NUMERIC: {
        value: "numeric",
        label: "Numeriskt",
        settings: [
            "default_answer",
            "decimals",
            "tolerance",
            "round_to"
        ]
    },
    FRACTION: {
        value: "fraction",
        label: "Bråk",
        settings: [
            "default_answer",
            "require_simplified",
            "allow_decimal"
        ]
    },
    ALGEBRA: {
        value: "algebra",
        label: "Algebra",
        settings: [
            "default_answer"
        ]
    },
    VARIABLES: {
        value: "variables",
        label: "Variabler",
        settings: [
            "default_answer",
            "ignore_variable_names"
        ]
    }
};

export const EXAM_STATUSES = {
    IN_PROGRESS: "in_progress",
    SUBMITTED: "submitted",
    GRADED: "graded"
};

export const getQuestionTypeLabel = (
    value
) =>
    Object
        .values(QUESTION_TYPES)
        .find(
            type =>
                type.value === value
        )?.label ?? value;

export const getGradingModeLabel = (
    value
) =>
    Object
        .values(GRADING_MODES)
        .find(
            mode =>
                mode.value === value
        )?.label ?? value;