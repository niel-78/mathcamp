const GROUP_COLORS = [
    { background: "#dbeafe", border: "#2563eb", text: "#1e3a8a" },
    { background: "#dcfce7", border: "#16a34a", text: "#14532d" },
    { background: "#fef3c7", border: "#d97706", text: "#78350f" },
    { background: "#fce7f3", border: "#db2777", text: "#831843" },
    { background: "#e0e7ff", border: "#4f46e5", text: "#312e81" },
    { background: "#ccfbf1", border: "#0f766e", text: "#134e4a" },
    { background: "#ffe4e6", border: "#e11d48", text: "#881337" },
    { background: "#ede9fe", border: "#7c3aed", text: "#4c1d95" },
    { background: "#fee2e2", border: "#dc2626", text: "#7f1d1d" },
    { background: "#f0fdf4", border: "#22c55e", text: "#166534" },
    { background: "#fff7ed", border: "#ea580c", text: "#7c2d12" },
    { background: "#f0f9ff", border: "#0284c7", text: "#0c4a6e" },
    { background: "#fdf4ff", border: "#c026d3", text: "#701a75" },
    { background: "#f7fee7", border: "#65a30d", text: "#365314" },
    { background: "#eef2ff", border: "#6366f1", text: "#312e81" },
    { background: "#f1f5f9", border: "#475569", text: "#1e293b" }
];

export { GROUP_COLORS };

export function getGroupColor(groupId, colorIndex) {
    if (groupId === null || typeof groupId === "undefined") {
        return null;
    }

    if (colorIndex !== null && typeof colorIndex !== "undefined") {
        const overrideIndex = Number(colorIndex);

        if (Number.isFinite(overrideIndex)) {
            return GROUP_COLORS[
                ((overrideIndex % GROUP_COLORS.length) + GROUP_COLORS.length) % GROUP_COLORS.length
            ];
        }
    }

    const numericGroupId = Number(groupId);
    const colorIndexFallback = Number.isFinite(numericGroupId)
        ? Math.abs(numericGroupId) % GROUP_COLORS.length
        : 0;

    return GROUP_COLORS[colorIndexFallback];
}