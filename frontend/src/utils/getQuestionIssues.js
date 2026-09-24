import { checkOptionValues } from "@/utils/checkOptionValues";

function isCorrectOption(option) {
    return (
        option?.is_correct === true ||
        Number(option?.is_correct) === 1 ||
        option?.isCorrect === true ||
        Number(option?.isCorrect) === 1
    );
}

export function getQuestionIssues(
    question,
    block = null,
    includeInactive = false
) {
    if (!question) return [];

    // Ignorera om blocket är raderat eller arkiverat
    if (!includeInactive && block && (block.deleted_at || block.archived_at)) {
        return [];
    }

    // Ignorera raderade eller arkiverade frågor
    if (!includeInactive && (question.deleted_at || question.archived_at)) {
        return [];
    }

    const issues = [];
    const correctOptions = (question.options || []).filter(isCorrectOption);
    const options = question.options || [];

    let answerConfig = {};
    if (typeof question.answer_config === "string") {
        try {
            answerConfig = JSON.parse(question.answer_config);
        } catch {
            answerConfig = {};
        }
    } else if (question.answer_config) {
        answerConfig = question.answer_config;
    }

    const configuredCorrectAnswers = Array.isArray(answerConfig?.correctAnswers)
        ? answerConfig.correctAnswers.filter(answer => String(answer ?? "").trim() !== "")
        : [];
    const configuredVariables = Array.isArray(answerConfig?.variables)
        ? answerConfig.variables.filter(variable => String(variable?.answer ?? "").trim() !== "")
        : [];

    const hasDefaultAnswer =
        answerConfig?.default_answer !== undefined &&
        answerConfig?.default_answer !== null &&
        String(answerConfig.default_answer).trim() !== "";

    // 1. Saknar korrekt lösning
    if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
        if (correctOptions.length === 0) {
            issues.push({
                type: "missing_correct",
                questionId: question.id,
                message: "Saknar korrekt lösning"
            });
        }
    } else if (
        question.question_type === "numeric_input" ||
        question.question_type === "equation" ||
        question.question_type === "linear_system" ||
        question.question_type === "expression" ||
        question.question_type === "factorization" ||
        question.question_type === "text"
    ) {
        if (correctOptions.length === 0) {
            issues.push({
                type: "missing_correct",
                questionId: question.id,
                message: "Saknar korrekt lösning / facit"
            });
        }
    }

    // 2. Fel i alternativ
    if (options.length > 1) {
        const check = checkOptionValues(options);
        if (!check.valid) {
            issues.push({
                type: "option_error",
                questionId: question.id,
                message: `Fel i svarsalternativ (${check.issues.join(", ")})`
            });
        }
    }

    // 3. Numeriska uppgifter behöver ett facit. Svarsrutor skapas från facit;
    // {{input}} är en valfri äldre inline-markör.
    if (
        question.question_type === "numeric_input" ||
        question.question_type === "equation" ||
        question.question_type === "linear_system"
    ) {
        const expectedCount = question.question_type === "linear_system"
            ? configuredVariables.length
            : correctOptions.length || configuredCorrectAnswers.length || (hasDefaultAnswer ? 1 : 0);
        if (expectedCount === 0) {
            issues.push({
                type: "input_count_mismatch",
                questionId: question.id,
                message: "Saknar facit för numerisk svarsruta"
            });
        }

        if (question.question_type === "linear_system" && configuredVariables.length < 2) {
            issues.push({
                type: "input_count_mismatch",
                questionId: question.id,
                message: "Ett ekvationssystem måste ha minst två namngivna svar."
            });
        }

        if (question.question_type === "numeric_input") {
            const markerCount = (question.question.match(/\{\{input\}\}/g) || []).length;
            if (correctOptions.length !== markerCount) {
                issues.push({
                    type: "input_count_mismatch",
                    questionId: question.id,
                    message: "Antalet svarsrutor matchar inte antalet korrekta svar."
                });
            }
        }
    }

    // 4. Felanmälan från elever
    if (Number(question.report_count) > 0) {
        issues.push({
            type: "report",
            questionId: question.id,
            message: `${question.report_count} ${Number(question.report_count) > 1 ? "felanmälningar" : "felanmälan"}`
        });
    }

    return issues;
}

export function getBlockIssues(block, includeInactive = false) {
    if (!block || (!includeInactive && (block.deleted_at || block.archived_at))) {
        return [];
    }

    const issues = [];
    const questions = (block.questions || []).filter(
        q => includeInactive || (!q.deleted_at && !q.archived_at)
    );

    questions.forEach((q, idx) => {
        const questionNum = idx + 1;
        const qIssues = getQuestionIssues(q, block, includeInactive);
        qIssues.forEach(issue => {
            issues.push({
                ...issue,
                questionNum,
                message: `Fråga ${questionNum}: ${issue.message}`
            });
        });
    });

    return issues;
}
