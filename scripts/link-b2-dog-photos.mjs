import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const PHOTO_GROUPS = [
  ["dog1A.jpg", "dog1B.jpg"],
  ["dog2A.jpg", "dog2B.jpg", "dog2C.jpg"],
  ["dog3A.jpg", "dog3B.jpg", "dog3C.jpg"],
];

const DEFAULT_B2_PUBLIC_BASE_URL = "https://f006.backblazeb2.com/file/pawjai";

function parseEnvFile(raw) {
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function loadLocalEnv() {
  const envFiles = [".env.local", ".env"];

  for (const filename of envFiles) {
    const fullPath = path.join(repoRoot, filename);

    try {
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = parseEnvFile(raw);

      for (const [key, value] of Object.entries(parsed)) {
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseArgs(argv) {
  const names = [];
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    names.push(arg);
  }

  return { dryRun, names };
}

function usage() {
  const example = [
    'npm run link:dog-photos -- "Dog One" "Dog Two" "Dog Three"',
    'npm run link:dog-photos -- --dry-run "Dog One" "Dog Two" "Dog Three"',
  ];

  return [
    `Provide exactly ${PHOTO_GROUPS.length} dog names in the order dog1, dog2, dog3.`,
    "",
    "Examples:",
    ...example.map((line) => `  ${line}`),
  ].join("\n");
}

function buildPublicUrl(storagePath) {
  const baseUrl = (process.env.PAWJAI_B2_PUBLIC_BASE_URL ?? DEFAULT_B2_PUBLIC_BASE_URL).replace(/\/+$/, "");
  return `${baseUrl}/${storagePath}`;
}

async function resolveDogByName(supabase, name) {
  const { data, error } = await supabase
    .from("dogs")
    .select("id, name")
    .eq("name", name);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`No dog found with exact name "${name}".`);
  }

  if (data.length > 1) {
    throw new Error(`Multiple dogs found with exact name "${name}". Please use a unique dog name.`);
  }

  return data[0];
}

async function upsertPhotoRecord(supabase, { dogId, storagePath, publicUrl, isCover, sortOrder, dryRun }) {
  const { data: existingRows, error: findError } = await supabase
    .from("dog_photos")
    .select("id, public_url, is_cover, sort_order")
    .eq("dog_id", dogId)
    .eq("public_url", publicUrl);

  if (findError) {
    throw findError;
  }

  const existingRow = existingRows?.[0] ?? null;

  if (isCover && !dryRun) {
    const { error: clearCoverError } = await supabase
      .from("dog_photos")
      .update({ is_cover: false })
      .eq("dog_id", dogId)
      .eq("is_cover", true)
      .neq("public_url", publicUrl);

    if (clearCoverError) {
      throw clearCoverError;
    }
  }

  if (existingRow) {
    if (dryRun) {
      return { action: "skip", storagePath };
    }

    const patch = {};

    if (existingRow.is_cover !== isCover) {
      patch.is_cover = isCover;
    }

    if (existingRow.sort_order !== sortOrder) {
      patch.sort_order = sortOrder;
    }

    if (Object.keys(patch).length === 0) {
      return { action: "skip", storagePath };
    }

    const { error: updateError } = await supabase
      .from("dog_photos")
      .update(patch)
      .eq("id", existingRow.id);

    if (updateError) {
      throw updateError;
    }

    return { action: "update", storagePath };
  }

  if (dryRun) {
    return { action: "insert", storagePath };
  }

  const { error: insertError } = await supabase.from("dog_photos").insert({
    dog_id: dogId,
    storage_path: storagePath,
    public_url: publicUrl,
    is_cover: isCover,
    sort_order: sortOrder,
  });

  if (insertError) {
    throw insertError;
  }

  return { action: "insert", storagePath };
}

async function main() {
  await loadLocalEnv();

  const { dryRun, names } = parseArgs(process.argv.slice(2));

  if (names.length !== PHOTO_GROUPS.length) {
    throw new Error(`${usage()}`);
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const summary = [];

  for (const [groupIndex, dogName] of names.entries()) {
    const dog = await resolveDogByName(supabase, dogName);
    const filenames = PHOTO_GROUPS[groupIndex];

    summary.push(`dog${groupIndex + 1}: ${dog.name} (${dog.id})`);

    for (const [photoIndex, filename] of filenames.entries()) {
      const storagePath = `pawjaidogs/${filename}`;
      const result = await upsertPhotoRecord(supabase, {
        dogId: dog.id,
        storagePath,
        publicUrl: buildPublicUrl(storagePath),
        isCover: photoIndex === 0,
        sortOrder: photoIndex,
        dryRun,
      });

      summary.push(`  ${result.action.toUpperCase()} ${storagePath}`);
    }
  }

  console.log(dryRun ? "Dry run only. No database changes were made." : "Dog photos linked successfully.");
  console.log(summary.join("\n"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
