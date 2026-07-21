import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadDogMediaModel() {
  const source = readFileSync(new URL("../utils/dog-media.ts", import.meta.url), "utf8");
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
    JSON,
  });
  return module.exports;
}

test("rewrites legacy PawJai media URLs to the new media CDN", () => {
  const { buildDogMediaItems } = loadDogMediaModel();

  const media = buildDogMediaItems({
    photos: [
      {
        id: "photo-1",
        is_cover: true,
        public_url: "https://media.pawjai.co.th/file/pawjai/pawjaidogs/dog-1.jpg",
        sort_order: 0,
        storage_path: "pawjaidogs/dog-1.jpg",
      },
      {
        id: "photo-2",
        is_cover: false,
        public_url: "https://f006.backblazeb2.com/file/pawjai/pawjaidogs/dog-2.jpg",
        sort_order: 1,
        storage_path: null,
      },
    ],
    traits: [],
  });

  assert.equal(
    JSON.stringify(media.map((item) => item.publicUrl)),
    JSON.stringify([
      "https://media.pawjaipet.com/file/pawjai/pawjaidogs/dog-1.jpg",
      "https://media.pawjaipet.com/file/pawjai/pawjaidogs/dog-2.jpg",
    ]),
  );
});

test("rewrites legacy media manifest URLs to the new media CDN", () => {
  const { parseDogMediaManifest } = loadDogMediaModel();

  const media = parseDogMediaManifest([
    {
      trait_type: "media_manifest",
      trait_value: JSON.stringify({
        items: [
          {
            id: "video-1",
            isCover: true,
            posterUrl: "https://media.pawjai.co.th/file/pawjai/pawjaidogs/dog-poster.jpg",
            publicUrl: "https://f006.backblazeb2.com/file/pawjai/pawjaidogs/dog-video.mp4",
            sortOrder: 0,
            type: "video",
          },
        ],
      }),
    },
  ]);

  assert.equal(media[0].posterUrl, "https://media.pawjaipet.com/file/pawjai/pawjaidogs/dog-poster.jpg");
  assert.equal(media[0].publicUrl, "https://media.pawjaipet.com/file/pawjai/pawjaidogs/dog-video.mp4");
});
