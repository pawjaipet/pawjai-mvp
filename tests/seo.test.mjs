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

function loadAuthCookiesModel() {
  const source = readFileSync(new URL("../utils/supabase/auth-cookies.ts", import.meta.url), "utf8");
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
  });
  return module.exports;
}

test("canonical URLs always use the PawJai www production domain", () => {
  const { SITE_URL, canonicalUrl } = loadSeoModel();

  assert.equal(SITE_URL, "https://www.pawjaipet.com");
  assert.equal(canonicalUrl("/dogs"), "https://www.pawjaipet.com/dogs");
  assert.equal(canonicalUrl("dogs/dog-1"), "https://www.pawjaipet.com/dogs/dog-1");
  assert.equal(canonicalUrl("/dogs/dog-1?from=swipe"), "https://www.pawjaipet.com/dogs/dog-1");
});

test("/dogs renders the public dog feed directly instead of importing the swipe redirect", () => {
  const source = readFileSync(new URL("../app/dogs/page.tsx", import.meta.url), "utf8");

  assert.match(source, /DogFeedPage/);
  assert.doesNotMatch(source, /swipe\/page/);
});

test("anonymous requests can skip Supabase auth refresh when no auth cookies exist", () => {
  const { hasSupabaseAuthCookies } = loadAuthCookiesModel();

  assert.equal(hasSupabaseAuthCookies([]), false);
  assert.equal(hasSupabaseAuthCookies([{ name: "NEXT_LOCALE" }]), false);
  assert.equal(hasSupabaseAuthCookies([{ name: "sb-bdnyvcvkyepipdcygkvn-auth-token" }]), true);
  assert.equal(hasSupabaseAuthCookies([{ name: "sb-bdnyvcvkyepipdcygkvn-auth-token.0" }]), true);
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
      "https://www.pawjaipet.com/",
      "https://www.pawjaipet.com/about",
      "https://www.pawjaipet.com/dogs",
      "https://www.pawjaipet.com/shelter",
      "https://www.pawjaipet.com/dogs/available-dog",
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
    "/shelter/thevoicefoundation",
    "/swipe",
  ]) {
    assert.equal(isNoindexPath(path), true, path);
  }

  for (const path of ["/", "/about", "/dogs", "/dogs/dog-1", "/shelter"]) {
    assert.equal(isNoindexPath(path), false, path);
  }
});
