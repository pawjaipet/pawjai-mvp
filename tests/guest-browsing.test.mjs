import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({ exports: module.exports, module });
  return module.exports;
}

const prompt = loadModule("../utils/guest-signup-prompt.ts");
const feedModel = loadModule("../utils/swipe-feed-model.ts");
const feedPage = readFileSync(new URL("../components/dogs/DogFeedPage.tsx", import.meta.url), "utf8");
const swipeFeed = readFileSync(new URL("../components/SwipeFeed.tsx", import.meta.url), "utf8");

const dogs = Array.from({ length: 30 }, (_, index) => ({ id: `dog-${index + 1}` }));
const ids = (list) => JSON.stringify(list.map((dog) => dog.id));

test("logged-out visitors see every available dog", () => {
  const visible = feedModel.selectVisibleFeedDogs({
    dailyDogViewsRemaining: null,
    dogs,
    isLoggedIn: false,
    viewedDogIds: new Set(),
  });

  assert.equal(visible.length, 30);
  assert.equal(ids(visible), ids(dogs));
});

test("logged-out visitors are never capped, even if a limit is passed", () => {
  const visible = feedModel.selectVisibleFeedDogs({
    dailyDogViewsRemaining: 10,
    dogs,
    isLoggedIn: false,
    viewedDogIds: new Set(),
  });

  assert.equal(visible.length, 30);
});

test("accounts with a daily limit keep today's viewed dogs plus their remaining allowance", () => {
  const visible = feedModel.selectVisibleFeedDogs({
    dailyDogViewsRemaining: 2,
    dogs,
    isLoggedIn: true,
    viewedDogIds: new Set(["dog-5", "dog-9"]),
  });

  assert.equal(ids(visible), JSON.stringify(["dog-5", "dog-9", "dog-1", "dog-2"]));
});

test("unlimited plans see every dog", () => {
  const visible = feedModel.selectVisibleFeedDogs({
    dailyDogViewsRemaining: null,
    dogs,
    isLoggedIn: true,
    viewedDogIds: new Set(),
  });

  assert.equal(visible.length, 30);
});

test("the sign-up invite opens on the 9th dog for logged-out visitors", () => {
  const { GUEST_SIGNUP_PROMPT_AT_DOG, shouldShowGuestSignupPrompt } = prompt;

  assert.equal(GUEST_SIGNUP_PROMPT_AT_DOG, 9);
  assert.equal(shouldShowGuestSignupPrompt({ alreadyShown: false, dogsSeen: 8, isLoggedIn: false }), false);
  assert.equal(shouldShowGuestSignupPrompt({ alreadyShown: false, dogsSeen: 9, isLoggedIn: false }), true);
  assert.equal(shouldShowGuestSignupPrompt({ alreadyShown: false, dogsSeen: 25, isLoggedIn: false }), true);
});

test("the invite shows once per visit and never to signed-in adopters", () => {
  const { shouldShowGuestSignupPrompt } = prompt;

  assert.equal(shouldShowGuestSignupPrompt({ alreadyShown: true, dogsSeen: 9, isLoggedIn: false }), false);
  assert.equal(shouldShowGuestSignupPrompt({ alreadyShown: false, dogsSeen: 9, isLoggedIn: true }), false);
});

test("the feed no longer cuts logged-out visitors off, and Maybe later closes the invite", () => {
  assert.doesNotMatch(feedPage, /ANONYMOUS_DOG_VIEW_LIMIT/);
  assert.match(feedPage, /selectVisibleFeedDogs\(/);
  assert.match(swipeFeed, /shouldShowGuestSignupPrompt\(/);
  assert.match(swipeFeed, /onClick=\{closeFeedDialog\}[\s\S]*\{t\("Maybe later"\)\}/);
  assert.doesNotMatch(swipeFeed, /Visitors can preview/);
});
