import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

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

function summarize(records) {
  return {
    totalDogs: records.length,
    withPhotos: records.filter((record) => Boolean(record.photo_url)).length,
    withAliases: records.filter((record) => Boolean(record.alias)).length,
    withSpecialNeeds: records.filter((record) => Boolean(record.special_needs)).length,
  };
}

async function ensureShelter(supabase, shelterName) {
  const { data: existingShelter, error: findError } = await supabase
    .from("shelters")
    .select("id, name")
    .eq("name", shelterName)
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingShelter) {
    return existingShelter.id;
  }

  const { data: insertedShelter, error: insertError } = await supabase
    .from("shelters")
    .insert({
      name: shelterName,
      description:
        "Imported from the Pawjai intake spreadsheet for dogs under The Voice Foundation, with caretaker details preserved from the source sheet.",
      shelter_type: "animal_shelter",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return insertedShelter.id;
}

async function upsertDog(supabase, shelterId, record) {
  const dogPayload = {
    shelter_id: shelterId,
    name: record.name,
    gender: record.gender,
    age_months: record.age_months,
    background: record.background,
    special_needs: record.special_needs,
    adoption_status: record.adoption_status,
  };

  const { data: existingDog, error: findError } = await supabase
    .from("dogs")
    .select("id")
    .eq("shelter_id", shelterId)
    .eq("name", record.name)
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingDog) {
    const { data: updatedDog, error: updateError } = await supabase
      .from("dogs")
      .update(dogPayload)
      .eq("id", existingDog.id)
      .select("id")
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedDog.id;
  }

  const { data: insertedDog, error: insertError } = await supabase
    .from("dogs")
    .insert(dogPayload)
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return insertedDog.id;
}

async function ensureTrait(supabase, dogId, traitType, traitValue) {
  const { data: existingTrait, error: findError } = await supabase
    .from("dog_traits")
    .select("id")
    .eq("dog_id", dogId)
    .eq("trait_type", traitType)
    .eq("trait_value", traitValue)
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingTrait) {
    return;
  }

  const { error: insertError } = await supabase.from("dog_traits").insert({
    dog_id: dogId,
    trait_type: traitType,
    trait_value: traitValue,
  });

  if (insertError) {
    throw insertError;
  }
}

async function ensurePhoto(supabase, dogId, photoUrl) {
  const { data: existingPhoto, error: findError } = await supabase
    .from("dog_photos")
    .select("id")
    .eq("dog_id", dogId)
    .eq("public_url", photoUrl)
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingPhoto) {
    return;
  }

  const { error: insertError } = await supabase.from("dog_photos").insert({
    dog_id: dogId,
    storage_path: photoUrl,
    public_url: photoUrl,
    is_cover: true,
    sort_order: 0,
  });

  if (insertError) {
    throw insertError;
  }
}

async function main() {
  await loadLocalEnv();

  const dataPath = path.join(repoRoot, "data", "pawjai-dogs.json");
  const raw = await fs.readFile(dataPath, "utf8");
  const records = JSON.parse(raw);

  console.log("Prepared import summary:", summarize(records));

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. The normalized dog dataset is ready, but importing into the hosted database requires a service-role key.",
    );
    process.exitCode = 1;
    return;
  }

  const shelterName =
    process.env.PAWJAI_IMPORT_SHELTER_NAME ?? "The Voice Foundation";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const shelterId = await ensureShelter(supabase, shelterName);
  console.log(`Using shelter "${shelterName}" (${shelterId})`);

  let insertedOrUpdated = 0;
  let traitsAdded = 0;
  let photosAdded = 0;

  for (const record of records) {
    const dogId = await upsertDog(supabase, shelterId, record);
    insertedOrUpdated += 1;

    if (record.alias) {
      await ensureTrait(supabase, dogId, "alias", record.alias);
      traitsAdded += 1;
    }

    if (record.caretaker) {
      await ensureTrait(supabase, dogId, "caretaker", record.caretaker);
      traitsAdded += 1;
    }

    if (record.photo_note) {
      await ensureTrait(supabase, dogId, "photo_note", record.photo_note);
      traitsAdded += 1;
    }

    if (record.photo_url) {
      await ensurePhoto(supabase, dogId, record.photo_url);
      photosAdded += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        shelterName,
        shelterId,
        importedDogs: insertedOrUpdated,
        ensuredTraits: traitsAdded,
        ensuredPhotos: photosAdded,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Dog import failed.");
  console.error(error);
  process.exitCode = 1;
});
