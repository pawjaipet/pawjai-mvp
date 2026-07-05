import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAdminAuthorization() {
  const source = readFileSync(new URL("../utils/admin-authorization.ts", import.meta.url), "utf8");
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

test("recognizes only admin and shelter_admin as admin workspace roles", () => {
  const { isAdminWorkspaceRole } = loadAdminAuthorization();

  assert.equal(isAdminWorkspaceRole("admin"), true);
  assert.equal(isAdminWorkspaceRole("shelter_admin"), true);
  assert.equal(isAdminWorkspaceRole("adopter"), false);
  assert.equal(isAdminWorkspaceRole(null), false);
});

test("allows global admins to access every shelter", () => {
  const { canAccessShelter } = loadAdminAuthorization();

  assert.equal(
    canAccessShelter({
      role: "admin",
      shelterIds: [],
      targetShelterId: "shelter-a",
    }),
    true,
  );
});

test("limits shelter admins to assigned shelters", () => {
  const { canAccessShelter, scopeShelterIdsForRole } = loadAdminAuthorization();

  assert.equal(
    canAccessShelter({
      role: "shelter_admin",
      shelterIds: ["shelter-a"],
      targetShelterId: "shelter-a",
    }),
    true,
  );
  assert.equal(
    canAccessShelter({
      role: "shelter_admin",
      shelterIds: ["shelter-a"],
      targetShelterId: "shelter-b",
    }),
    false,
  );
  assert.deepEqual(scopeShelterIdsForRole("shelter_admin", ["shelter-a", "shelter-b"]), [
    "shelter-a",
    "shelter-b",
  ]);
  assert.equal(scopeShelterIdsForRole("admin", ["shelter-a"]), null);
});
