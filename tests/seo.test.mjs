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

function loadJsonLdModel() {
  const source = readFileSync(new URL("../utils/json-ld.ts", import.meta.url), "utf8");
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
    require(id) {
      if (id === "@/utils/seo") return loadSeoModel();
      throw new Error(`Unexpected require: ${id}`);
    },
  });
  return module.exports;
}

test("canonical URLs always use the PawJai www production domain", () => {
  const { BRAND_SEARCH_ALIASES, SITE_URL, canonicalUrl } = loadSeoModel();

  assert.equal(SITE_URL, "https://www.pawjaipet.com");
  assert.equal(canonicalUrl("/dogs"), "https://www.pawjaipet.com/dogs");
  assert.equal(canonicalUrl("dogs/dog-1"), "https://www.pawjaipet.com/dogs/dog-1");
  assert.equal(canonicalUrl("/dogs/dog-1?from=swipe"), "https://www.pawjaipet.com/dogs/dog-1");
  assert.equal(BRAND_SEARCH_ALIASES[0], "PawJai Pet");
  assert.equal(BRAND_SEARCH_ALIASES.includes("pawjaipet"), true);
  assert.equal(BRAND_SEARCH_ALIASES.includes("Project Pet"), true);
  assert.equal(BRAND_SEARCH_ALIASES.includes("Project Pet shelter"), true);
});

test("/dogs renders the public dog feed directly instead of importing the swipe redirect", () => {
  const source = readFileSync(new URL("../app/dogs/page.tsx", import.meta.url), "utf8");

  assert.match(source, /DogFeedPage/);
  assert.doesNotMatch(source, /swipe\/page/);
});

test("dog profiles are publicly readable while booking and saving stay gated", () => {
  const source = readFileSync(new URL("../app/dogs/[id]/page.tsx", import.meta.url), "utf8");
  const cardSource = readFileSync(new URL("../components/SwipeDogCard.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /ProtectedRouteGate/);
  assert.doesNotMatch(cardSource, /view this dog profile/);
  assert.match(source, /Sign in to book a visit/);
  assert.match(source, /user &&/);
  assert.match(cardSource, /book this shelter visit/);
});

test("anonymous requests can skip Supabase auth refresh when no auth cookies exist", () => {
  const { hasSupabaseAuthCookies } = loadAuthCookiesModel();

  assert.equal(hasSupabaseAuthCookies([]), false);
  assert.equal(hasSupabaseAuthCookies([{ name: "NEXT_LOCALE" }]), false);
  assert.equal(hasSupabaseAuthCookies([{ name: "sb-bdnyvcvkyepipdcygkvn-auth-token" }]), true);
  assert.equal(hasSupabaseAuthCookies([{ name: "sb-bdnyvcvkyepipdcygkvn-auth-token.0" }]), true);
});

test("structured data uses production URLs and escapes HTML-sensitive characters", () => {
  const { jsonLdScriptValue, pawjaiWebsiteJsonLd, webPageJsonLd } = loadJsonLdModel();

  assert.equal(jsonLdScriptValue({ name: "<PawJai>" }), "{\"name\":\"\\u003cPawJai>\"}");
  assert.equal(pawjaiWebsiteJsonLd().name, "PawJai Pet");
  assert.equal(pawjaiWebsiteJsonLd().url, "https://www.pawjaipet.com");
  assert.equal(pawjaiWebsiteJsonLd().alternateName.includes("Project Pet"), true);
  assert.equal(webPageJsonLd({ description: "Shelter sign in", name: "Shelter", path: "/shelter" }).url, "https://www.pawjaipet.com/shelter");
});

test("swipe feed media only loads active dog images eagerly", () => {
  const cardSource = readFileSync(new URL("../components/SwipeDogCard.tsx", import.meta.url), "utf8");
  const feedSource = readFileSync(new URL("../components/SwipeFeed.tsx", import.meta.url), "utf8");
  const videoSource = readFileSync(new URL("../components/dogs/DogVideoFrame.tsx", import.meta.url), "utf8");

  assert.match(feedSource, /const shouldRenderContent = Math\.abs\(idx - activeIndex\) <= 1/);
  assert.match(cardSource, /loading=\{isActive && i === 0 \? "eager" : "lazy"\}/);
  assert.match(cardSource, /fetchPriority=\{isActive && i === 0 \? "high" : "low"\}/);
  assert.match(videoSource, /loading="lazy"/);
  assert.match(videoSource, /fetchPriority="low"/);
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
