import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('edit saves matching tags transactionally instead of deleting before an HTTP insert', () => {
  const source = read('app/admin/dogs/[id]/edit/actions.ts');
  assert.ok(source.includes('rpc("replace_dog_matching_tags"'));
  assert.ok(!source.includes('deleteTraitError'));
});

test('both dog editors refuse to turn a trait read failure into an empty editable form', () => {
  for (const path of ['app/admin/dogs/[id]/edit/page.tsx', 'app/shelter/[slug]/dogs/[id]/edit/page.tsx']) {
    const source = read(path);
    assert.ok(source.includes('error: traitsError'));
    assert.ok(source.includes('if (traitsError) throw'));
  }
});

test('care completeness is explicitly separate from matching tags and database availability', () => {
  const source = read('components/admin/AdminReorgDraftPanel.tsx');
  assert.ok(source.includes('dog.careUnavailable'));
  assert.ok(source.includes('Care records unavailable'));
  assert.ok(source.includes('care fields incomplete'));
  assert.ok(!source.includes('} fields missing'));
});
