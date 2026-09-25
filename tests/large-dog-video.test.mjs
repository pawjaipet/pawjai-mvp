import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../utils/prepare-large-dog-video.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function('exports', 'MediaRecorder', js)(exports, undefined);
const prepare = exports.prepareLargeDogVideo;

test('normal-sized videos go directly to server compression', async () => {
  const file = { name: 'dog.mov', size: 50 * 1024 * 1024 };
  assert.equal(await prepare(file, () => {}), file);
});

test('oversized videos have an actionable limit error', async () => {
  await assert.rejects(prepare({ name: 'dog.mov', size: 251 * 1024 * 1024 }, () => {}), /over 250MB.*Other files will still be kept/);
});

test('unsupported browser preparation fails clearly without accessing the DOM', async () => {
  await assert.rejects(prepare({ name: 'dog.mov', size: 51 * 1024 * 1024 }, () => {}), /browser cannot prepare large videos/);
});
