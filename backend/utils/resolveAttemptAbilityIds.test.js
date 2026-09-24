import test from "node:test";
import assert from "node:assert/strict";

import { resolveAttemptAbilityIds } from "./resolveAttemptAbilityIds.js";

test("reads ability ids from nested attempt config", () => {
  const config = {
    attempt: {
      abilityQuestionCounts: {
        "12": 2,
        "99": 1
      }
    }
  };

  assert.deepEqual(resolveAttemptAbilityIds(config), [12, 99]);
});

test("reads ability ids from legacy root config and ignores invalid values", () => {
  const config = {
    abilityQuestionCounts: {
      "5": 4,
      "abc": 2,
      "0": 1,
      "7": 0
    },
    ability_question_counts: {
      "22": 2,
      "8": 3
    }
  };

  assert.deepEqual(resolveAttemptAbilityIds(config), [5, 8, 22]);
});
