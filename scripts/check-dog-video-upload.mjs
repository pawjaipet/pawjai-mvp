// Run with: node --env-file=.env.local scripts/check-dog-video-upload.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pawjai-video-check-"));
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const bucket = "dog-upload-staging";
const objectPath = `qa/${randomUUID()}.mov`;
try {
  const input = path.join(directory, "sample.mov");
  await execFileAsync(require("ffmpeg-static"), ["-y", "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30", "-t", "20", "-c:v", "mpeg4", "-b:v", "12M", input]);
  const original = await fs.readFile(input);
  assert.ok(original.length > 16 * 1024 * 1024);
  if (!(await admin.storage.getBucket(bucket)).data) {
    const { error } = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 50 * 1024 * 1024 });
    assert.equal(error, null);
  }
  const { data: signed, error } = await admin.storage.from(bucket).createSignedUploadUrl(objectPath);
  assert.equal(error, null);
  const response = await fetch(signed.signedUrl, { method: "PUT", headers: { "Content-Type": "video/quicktime" }, body: original });
  assert.ok(response.ok, `Direct upload returned ${response.status}: ${await response.text()}`);
  const { data: downloaded, error: downloadError } = await admin.storage.from(bucket).download(objectPath);
  assert.equal(downloadError, null);
  assert.equal(downloaded.size, original.length);

  const source = await fs.readFile(new URL("../app/admin/dogs/new/actions.ts", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("actions.ts", source, ts.ScriptTarget.Latest, true);
  const compression = parsed.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "optimizeDogVideo");
  const compiled = ts.transpileModule(compression.getText(parsed), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const optimize = new Function("require", "fs", "os", "path", "execFileAsync", "fileExists", "DOG_VIDEO_DURATION_SECONDS", `${compiled}; return optimizeDogVideo;`)(require, fs, os, path, execFileAsync, async (p) => Boolean(await fs.stat(p)), 10);
  const compressed = await optimize(Buffer.from(await downloaded.arrayBuffer()));
  assert.ok(compressed.length < original.length);
  const output = path.join(directory, "compressed.mp4");
  await fs.writeFile(output, compressed);
  await execFileAsync(require("ffmpeg-static"), ["-v", "error", "-i", output, "-f", "null", "-"]);
  console.log(JSON.stringify({ directUpload: "passed", serverCompression: "passed", playbackDecode: "passed", originalBytes: original.length, compressedBytes: compressed.length }));
} finally {
  await admin.storage.from(bucket).remove([objectPath]);
  await fs.rm(directory, { recursive: true, force: true });
}
