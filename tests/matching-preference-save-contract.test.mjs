import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('preference saving retains the complete payload and reports failures', () => {
  const source = readFileSync(new URL('../app/actions/preferences.ts', import.meta.url), 'utf8');
  assert.ok(source.includes('.upsert({ adopter_id: adopter.id, ...updates }'));
  assert.ok(!source.includes('legacyUpdates'));
  assert.match(source, /if \(error\) return \{ error:/);
  assert.ok(source.indexOf('restoreAnswersFromSnapshot(preferences.filter_answers)') < source.indexOf('if (hasStructuredPreferenceAnswers(preferences))'));
});

test('filter navigation only occurs after a successful save', () => {
  const source = readFileSync(new URL('../app/filter/page.tsx', import.meta.url), 'utf8');
  assert.ok(source.indexOf('if (result.error) { setSaveError(result.error); return; }') < source.indexOf('router.push("/")'));
});
