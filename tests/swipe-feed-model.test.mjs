import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadSwipeFeedModel() {
  const source = readFileSync(new URL("../utils/swipe-feed-model.ts", import.meta.url), "utf8");
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

test("injects ads every three dogs and cycles through available ads", () => {
  const { buildSwipeFeed } = loadSwipeFeedModel();
  const dogs = Array.from({ length: 10 }, (_, index) => ({ id: `dog-${index + 1}` }));
  const ads = [{ id: "ad-a" }, { id: "ad-b" }, { id: "ad-c" }];

  const feed = buildSwipeFeed(dogs, ads, 3);

  assert.equal(feed.length, 13);
  assert.equal(feed[3].kind, "ad");
  assert.equal(feed[3].ad.id, "ad-a");
  assert.equal(feed[7].kind, "ad");
  assert.equal(feed[7].ad.id, "ad-b");
  assert.equal(feed[11].kind, "ad");
  assert.equal(feed[11].ad.id, "ad-c");
});

test("does not reserve ad slots when there are no live ads", () => {
  const { buildSwipeFeed } = loadSwipeFeedModel();
  const dogs = Array.from({ length: 6 }, (_, index) => ({ id: `dog-${index + 1}` }));

  const feed = buildSwipeFeed(dogs, [], 3);

  assert.equal(feed.length, 6);
  assert.equal(feed.every((item) => item.kind === "dog"), true);
});

test("marks dog cards active by feed index after ad insertion", () => {
  const { buildSwipeFeed, isActiveDogFeedItem } = loadSwipeFeedModel();
  const dogs = Array.from({ length: 6 }, (_, index) => ({ id: `dog-${index + 1}` }));
  const ads = [{ id: "ad-a" }];
  const feed = buildSwipeFeed(dogs, ads, 3);

  assert.equal(feed[6].kind, "dog");
  assert.equal(feed[6].dog.id, "dog-6");
  assert.equal(isActiveDogFeedItem(feed[6], 6, 6), true);
  assert.equal(isActiveDogFeedItem(feed[6], 6, 5), false);
});
