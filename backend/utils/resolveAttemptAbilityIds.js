function parseConfig(value) {
    if (typeof value === "string") {
        try {
            return JSON.parse(value || "{}");
        } catch {
            return {};
        }
    }

    return value || {};
}

export function resolveAttemptAbilityIds(config) {
    const parsedConfig = parseConfig(config);
    const sources = [
        parsedConfig.abilityQuestionCounts,
        parsedConfig.ability_question_counts,
        parsedConfig.attempt?.abilityQuestionCounts,
        parsedConfig.attempt?.ability_question_counts
    ];

    const ids = new Set();

    for (const source of sources) {
        if (!source || typeof source !== "object") {
            continue;
        }

        for (const [key, value] of Object.entries(source)) {
            const abilityId = Number(key);
            const count = Number(value);

            if (
                Number.isInteger(abilityId) &&
                abilityId > 0 &&
                Number.isInteger(count) &&
                count > 0
            ) {
                ids.add(abilityId);
            }
        }
    }

    return [...ids].sort((a, b) => a - b);
}
