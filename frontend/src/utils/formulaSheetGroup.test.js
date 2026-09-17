import test from "node:test";
import assert from "node:assert/strict";

import { resolveFormulaSheetGroup } from "./formulaSheetGroup.js";

test("resolves the actual student group from the joined assessment when selected group is not set", () => {
    const groups = [
        { id: 1, name: "Matte 1A", level_code: "Matematik 1A" },
        { id: 2, name: "Matte 3B", level_code: "Matematik 3B" }
    ];

    const resolved = resolveFormulaSheetGroup({
        groups,
        selectedGroupId: "",
        groupExam: { group_name: "Matte 3B" }
    });

    assert.deepEqual(resolved, groups[1]);
});

test("prefers the currently selected group when matching the active assessment", () => {
    const groups = [
        { id: 1, name: "Matte 1A", level_code: "Matematik 1A" },
        { id: 2, name: "Matte 3B", level_code: "Matematik 3B" }
    ];

    const resolved = resolveFormulaSheetGroup({
        groups,
        selectedGroupId: "2",
        groupExam: { group_name: "Matte 1A" }
    });

    assert.deepEqual(resolved, groups[1]);
});
