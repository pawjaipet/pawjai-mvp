import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("forged own-shelter form cannot edit another shelter's dog", async () => {
  const source = readFileSync(new URL("../app/admin/dogs/[id]/edit/actions.ts", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("actions.ts", source, ts.ScriptTarget.Latest, true);
  const node = parsed.statements.find((item) => ts.isFunctionDeclaration(item) && item.name?.text === "updateDogProfileAction");
  const compiled = ts.transpileModule(node.getText(parsed).replace("export async", "async"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const getString = (data, key) => String(data.get(key) ?? "");
  for (const dog of [{ id: "foreign-dog", shelter_id: "other-shelter" }, null]) {
    let writes = 0;
    const query = {
      select() { return query; }, eq() { return query; },
      maybeSingle: async () => ({ data: dog, error: null }),
      update() { writes++; throw new Error("Unauthorized write reached"); },
    };
    const bindings = {
      getString, getOptionalString: getString, getOptionalNumber: () => null,
      getStringValues: () => [], normalizeNewPhotoFiles: () => [],
      canonicalizeBreedLabel: (value) => value, isCanonicalDogBreed: () => true,
      requireShelterAccess: async (shelter) => {
        assert.equal(shelter, "my-shelter");
        return { isGlobalAdmin: false, shelterIds: ["my-shelter"] };
      },
      createAdminClient: () => ({ from: () => query }),
    };
    const action = new Function(...Object.keys(bindings), `${compiled}; return updateDogProfileAction;`)(...Object.values(bindings));
    const form = new FormData();
    Object.entries({ dog_id: "foreign-dog", shelter_id: "my-shelter", name: "Forged edit", breed: "Thai Dog" }).forEach(([k,v]) => form.set(k,v));
    const result = await action({}, form);
    assert.equal(result.status, "error");
    assert.equal(writes, 0);
  }
});
