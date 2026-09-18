import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("changing the cover succeeds on the first save under the one-cover constraint", async () => {
  const source = readFileSync(new URL("../app/admin/dogs/[id]/edit/actions.ts", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("actions.ts", source, ts.ScriptTarget.Latest, true);
  const node = parsed.statements.find((item) => ts.isFunctionDeclaration(item) && item.name?.text === "updateDogMediaOrder");
  const js = ts.transpileModule(node.getText(parsed), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const photos = [{ id: "old", is_cover: true, sort_order: 0 }, { id: "new", is_cover: false, sort_order: 1 }];
  let manifest;
  const supabase = { from(table) {
    let update;
    const filters = [];
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      order() { return query; },
      in() { return query; },
      delete() { return query; },
      update(value) { update = value; return query; },
      insert(rows) { manifest = JSON.parse(rows[0].trait_value); return query; },
      async then(resolve) {
        // Deliberately delay clearing the old row to reproduce the original race.
        if (update && filters.some(([key, value]) => key === "id" && value === "old")) await new Promise((done) => setTimeout(done, 15));
        if (table === "dog_photos" && update) {
          for (const photo of photos.filter((p) => filters.every(([key, value]) => key === "dog_id" || p[key] === value))) {
            if (update.is_cover && photos.some((p) => p.id !== photo.id && p.is_cover)) return resolve({ error: { message: "dog_photos_one_cover_per_dog_idx" } });
            Object.assign(photo, update);
          }
        }
        resolve({ data: table === "dog_photos" ? photos : [], error: null });
      },
    };
    return query;
  } };
  const update = new Function("buildDogMediaItems", "getUniqueSubmittedOrder", `${js}; return updateDogMediaOrder;`)(
    ({ photos }) => photos.map((p) => ({ id: p.id, isCover: p.is_cover, sortOrder: p.sort_order, type: "photo", publicUrl: `${p.id}.jpg` })),
    (ids) => [...new Set(ids)],
  );
  await update({ coverMediaId: "new", dogId: "dog", dogName: "Test", mediaOrderIds: ["new", "old"], newPhotoFiles: [], supabase });
  assert.deepEqual(photos.filter((p) => p.is_cover).map((p) => p.id), ["new"]);
  assert.equal(manifest.items.find((p) => p.isCover).id, "new");
});
