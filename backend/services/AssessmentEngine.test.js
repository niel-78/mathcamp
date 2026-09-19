import test from 'node:test';
import assert from 'node:assert/strict';

import AssessmentEngine from './AssessmentEngine.js';

test('filterActiveBlockIds excludes archived and deleted block IDs', async () => {
  const db = {
    query: async (sql, params) => {
      assert.match(sql, /deleted_at IS NULL/i);
      assert.match(sql, /archived_at IS NULL/i);
      assert.deepEqual(params, [[1, 2, 3, 5]]);
      return [[{ id: 2 }, { id: 5 }]];
    }
  };

  const activeIds = await AssessmentEngine.filterActiveBlockIds(db, [1, 2, 3, 5]);

  assert.deepEqual(activeIds, [2, 5]);
});
