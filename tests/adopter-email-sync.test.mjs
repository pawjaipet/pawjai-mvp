import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadAdopterUtils(adminClient) {
  const source = readFileSync(new URL("../utils/adopter.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  function require(name) {
    if (name === "@/utils/supabase/admin") {
      return { createAdminClient: () => adminClient };
    }
    return {};
  }

  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
    require,
  });
  return module.exports;
}

function createAdminClientWithExistingAdopter() {
  const updates = [];
  const rows = {
    adopters: {
      email: null,
      first_name: null,
      id: "adopter-1",
      last_name: null,
      profile_id: "user-1",
    },
    profiles: {
      id: "user-1",
    },
  };

  return {
    updates,
    from(table) {
      const query = {
        eq() {
          return query;
        },
        insert() {
          throw new Error("insert should not be called for an existing adopter");
        },
        async maybeSingle() {
          return { data: rows[table], error: null };
        },
        select() {
          return query;
        },
        async single() {
          return { data: rows[table], error: null };
        },
        update(values) {
          updates.push({ table, values });
          rows[table] = { ...rows[table], ...values };
          return query;
        },
      };
      return query;
    },
  };
}

test("syncs an existing adopter email from the signed-in auth user", async () => {
  const admin = createAdminClientWithExistingAdopter();
  const { ensureAdopterForUser } = loadAdopterUtils(admin);

  const adopter = await ensureAdopterForUser({}, {
    email: "pawjaipet@gmail.com",
    id: "user-1",
    user_metadata: {
      full_name: "PawJai Tester",
    },
  });

  assert.equal(adopter.email, "pawjaipet@gmail.com");
  assert.deepEqual(JSON.parse(JSON.stringify(admin.updates.find((update) => update.table === "adopters")?.values)), {
    email: "pawjaipet@gmail.com",
    first_name: "PawJai",
    last_name: "Tester",
  });
});
