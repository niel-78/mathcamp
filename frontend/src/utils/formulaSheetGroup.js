export function resolveFormulaSheetGroup({
    groups = [],
    selectedGroupId = "",
    groupExam = null
} = {}) {
    const normalizedSelectedGroupId = String(selectedGroupId ?? "");

    const selectedGroup = groups.find(
        group => String(group?.id) === normalizedSelectedGroupId
    );

    if (selectedGroup) {
        return selectedGroup;
    }

    const groupExamName = String(groupExam?.group_name || groupExam?.name || "").trim().toLowerCase();

    if (groupExamName) {
        const matchingGroup = groups.find(group => {
            const candidateNames = [
                group?.name,
                group?.group_name,
                group?.level_name,
                group?.subject_name
            ].filter(Boolean).map(label => String(label).trim().toLowerCase());

            return candidateNames.some(candidate =>
                candidate === groupExamName ||
                candidate.includes(groupExamName) ||
                groupExamName.includes(candidate)
            );
        });

        if (matchingGroup) {
            return matchingGroup;
        }
    }

    return groups[0] || {};
}
