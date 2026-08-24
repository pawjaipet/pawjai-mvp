import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("donations server action file only exports async server actions", () => {
  const source = readFileSync(new URL("../app/donations/actions.ts", import.meta.url), "utf8");
  const exportedValues = [
    ...source.matchAll(/^export\s+(?!async\s+function|type\s+)(?:const|let|var|function|class)\s+([A-Za-z0-9_]+)/gm),
  ].map((match) => match[1]);

  assert.deepEqual(exportedValues, []);
});

test("donation slip uploads are image-only and optimized before storage", () => {
  const action = readFileSync(new URL("../app/donations/actions.ts", import.meta.url), "utf8");
  const screen = readFileSync(new URL("../components/donations/DonateScreen.tsx", import.meta.url), "utf8");

  assert.equal(action.includes('const DONATION_SLIP_IMAGE_MIME_TYPES = new Set(["image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"])'), true);
  assert.equal(action.includes("const MAX_DONATION_SLIP_BYTES = 6 * 1024 * 1024"), true);
  assert.equal(action.includes('contentType: preparedSlip.contentType'), true);
  assert.equal(action.includes('proof_mime_type: preparedSlip.contentType'), true);
  assert.equal(action.includes("Videos and PDFs are not supported."), true);
  assert.equal(action.includes("application/pdf"), false);
  assert.equal(screen.includes('accept=".heic,.heif,.jpg,.jpeg,.png,.webp,image/heic,image/heif,image/jpeg,image/png,image/webp"'), true);
  assert.equal(screen.includes("Upload one image only: JPG, PNG, WEBP, HEIC, or HEIF. Max 6 MB."), true);
});
