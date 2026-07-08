import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadSeoModel() {
  const source = readFileSync(new URL("../utils/seo.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
    URL,
  });
  return module.exports;
}

test("canonical URLs always use the PawJai www production domain", () => {
  const { SITE_URL, canonicalUrl } = loadSeoModel();

  assert.equal(SITE_URL, "https://www.pawjai.co.th");
  assert.equal(canonicalUrl("/dogs"), "https://www.pawjai.co.th/dogs");
  assert.equal(canonicalUrl("dogs/dog-1"), "https://www.pawjai.co.th/dogs/dog-1");
  assert.equal(canonicalUrl("/dogs/dog-1?from=swipe"), "https://www.pawjai.co.th/dogs/dog-1");
});

test("sitemap entries include stable public pages and available dog profiles only", () => {
  const { buildSitemapEntries } = loadSeoModel();

  const entries = buildSitemapEntries([
    { adoption_status: "available", id: "available-dog", updated_at: "2026-06-01T10:00:00Z" },
    { adoption_status: "adopted", id: "adopted-dog", updated_at: "2026-06-02T10:00:00Z" },
  ]);

  assert.equal(
    JSON.stringify(entries.map((entry) => entry.url)),
    JSON.stringify([
      "https://www.pawjai.co.th/",
      "https://www.pawjai.co.th/about",
      "https://www.pawjai.co.th/dogs",
      "https://www.pawjai.co.th/dogs/available-dog",
    ]),
  );
  assert.equal(entries.at(-1).lastModified.toISOString(), "2026-06-01T10:00:00.000Z");
});

test("private, auth, admin, and transactional paths are noindex", () => {
  const { isNoindexPath } = loadSeoModel();

  for (const path of [
    "/admin",
    "/admin/dogs",
    "/adopted",
    "/auth",
    "/auth/callback",
    "/appointments",
    "/booking/booking-1",
    "/booking/check-in",
    "/documents",
    "/dogs/dog-1/donate",
    "/filter",
    "/home",
    "/messages/dog-1",
    "/more",
    "/profile",
    "/schedule/dog-1",
    "/settings/subscription",
    "/shelter",
    "/shelter/thevoicefoundation",
    "/swipe",
  ]) {
    assert.equal(isNoindexPath(path), true, path);
  }

  for (const path of ["/", "/about", "/dogs", "/dogs/dog-1"]) {
    assert.equal(isNoindexPath(path), false, path);
  }
});
