// Additive upload of reviewed studio-background derivatives to Backblaze B2.
//
//   node --conditions=react-server --env-file=<path to .env.local> upload_b2.mjs <repo-root> <exports-root> [--dry-run]
//
// Rules (owner, 17 Nov): only under experiments/studio-background-v1/, never
// overwrite or delete anything, never touch originals or dog_photos rows.
// Uses the app's own uploadBufferToBackblaze (utils/backblaze.ts) for writes.
// Never prints environment values, keys, tokens or authorization URLs.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const PREFIX = "experiments/studio-background-v1/";
const PUBLIC_BASE = "https://media.pawjaipet.com/file/pawjai";
const [, , repoRoot, exportsRoot, flag] = process.argv;
const dryRun = flag === "--dry-run";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sha1 = (buffer) => createHash("sha1").update(buffer).digest("hex");

async function authorize() {
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  if (!keyId || !appKey || !process.env.B2_BUCKET_ID) throw new Error("B2 environment variables are missing (names only checked).");
  const response = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${appKey}`).toString("base64")}` },
  });
  if (!response.ok) throw new Error(`B2 authorization failed with status ${response.status}`);
  const auth = await response.json();
  return { apiUrl: auth.apiInfo?.storageApi?.apiUrl ?? auth.apiUrl, token: auth.authorizationToken, capabilities: auth.allowed?.capabilities ?? [] };
}

async function listPrefix(auth) {
  const files = new Map();
  let startFileName = null;
  for (let page = 0; page < 20; page += 1) {
    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      body: JSON.stringify({ bucketId: process.env.B2_BUCKET_ID, maxFileCount: 1000, prefix: PREFIX, startFileName }),
      headers: { Authorization: auth.token, "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) throw new Error(`B2 list failed with status ${response.status}`);
    const body = await response.json();
    for (const file of body.files ?? []) files.set(file.fileName, { sha1: file.contentSha1, size: file.contentLength });
    if (!body.nextFileName) break;
    startFileName = body.nextFileName;
  }
  return files;
}

const { uploadBufferToBackblaze } = await import(`${repoRoot}/utils/backblaze.ts`);
// Only derivatives the app manifest references are uploaded (review-only edits stay local).
const manifestSource = readFileSync(join(repoRoot, "utils/studio-experiment-manifest.ts"), "utf8");
const wanted = new Set([...manifestSource.matchAll(/"derivativeUrl": "https:\/\/media\.pawjaipet\.com\/file\/pawjai\/([^"]+)"/g)].map((m) => m[1]));
const local = walk(join(exportsRoot, PREFIX)).filter((path) => path.endsWith(".webp") && wanted.has(relative(exportsRoot, path).split("\\").join("/")));
if (local.length !== wanted.size) throw new Error(`manifest lists ${wanted.size} derivatives but ${local.length} local files match`);
const auth = await authorize();
console.log(`authorized; listFiles capability: ${auth.capabilities.includes("listFiles")}; local derivatives: ${local.length}`);
const existing = await listPrefix(auth);
console.log(`existing objects under ${PREFIX}: ${existing.size}`);

const results = [];
for (const path of local.sort()) {
  const objectName = relative(exportsRoot, path).split("\\").join("/");
  if (!objectName.startsWith(PREFIX) || !/^experiments\/studio-background-v1\/[0-9a-f-]{36}\/[0-9a-f]{12}(-v2)?\.webp$/.test(objectName)) {
    throw new Error(`refusing unexpected object name: ${objectName}`);
  }
  const body = readFileSync(path);
  const digest = sha1(body);
  const already = existing.get(objectName);
  if (already) {
    if (already.sha1 !== digest) throw new Error(`STOP: ${objectName} exists with different content; not overwriting.`);
    results.push({ objectName, sha1: digest, bytes: body.length, action: "already-present" });
    continue;
  }
  if (dryRun) {
    results.push({ objectName, sha1: digest, bytes: body.length, action: "would-upload" });
    continue;
  }
  const uploaded = await uploadBufferToBackblaze({ body, contentType: "image/webp", desiredPath: objectName });
  if (uploaded.storagePath !== objectName) throw new Error(`unexpected stored path for ${objectName}`);
  results.push({ objectName, sha1: digest, bytes: body.length, action: "uploaded" });
}

const after = dryRun ? existing : await listPrefix(auth);
let verified = 0;
for (const result of results) {
  const found = after.get(result.objectName);
  if (found && found.sha1 === result.sha1) verified += 1;
  result.publicUrl = `${PUBLIC_BASE}/${result.objectName}`;
}
const summary = results.reduce((acc, result) => ({ ...acc, [result.action]: (acc[result.action] ?? 0) + 1 }), {});
const resultsName = results.some((r) => r.objectName.endsWith("-v2.webp")) ? "b2-upload-results-v2.json" : "b2-upload-results.json";
writeFileSync(join(exportsRoot, resultsName), JSON.stringify({ prefix: PREFIX, at: new Date().toISOString(), dryRun, summary, verifiedInListing: verified, results }, null, 1));
console.log(JSON.stringify({ dryRun, summary, verifiedInListing: verified, total: results.length }));
