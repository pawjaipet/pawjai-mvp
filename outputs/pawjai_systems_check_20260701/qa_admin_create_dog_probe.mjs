import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const repoRoot = "/Users/sudlabha/Desktop/paw";
const outputDir = "/Users/sudlabha/Desktop/paw/outputs/pawjai_systems_check_20260701";
const imagePath = `${outputDir}/qa_assets/qa_codex_test_dog.jpg`;
const logPath = `${outputDir}/qa_admin_create_dog_probe_log.json`;

function parseDotEnv(contents) {
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function loadEnv() {
  const envFiles = [".env.local", ".env"];
  const merged = {};
  for (const file of envFiles) {
    try {
      Object.assign(merged, parseDotEnv(await fs.readFile(path.join(repoRoot, file), "utf8")));
    } catch {
      // Optional file.
    }
  }
  return { ...merged, ...process.env };
}

const env = await loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const startedAt = new Date().toISOString();
const suffix = startedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
const dogName = `QA-Codex-CreateDog-${suffix}`;
const storagePath = `qa-codex/${dogName}.jpg`;
const log = {
  cleanup: {},
  dogName,
  endedAt: null,
  imagePath,
  startedAt,
  steps: [],
  storagePath,
};
let dogId = null;
let photoId = null;

async function step(name, fn) {
  const stepLog = { name, ok: false, at: new Date().toISOString() };
  try {
    const result = await fn();
    stepLog.ok = true;
    stepLog.result = result ?? null;
    return result;
  } catch (error) {
    stepLog.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    log.steps.push(stepLog);
    await fs.writeFile(logPath, JSON.stringify(log, null, 2));
  }
}

try {
  const shelter = await step("select_shelter", async () => {
    const { data, error } = await supabase
      .from("shelters")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(1)
      .single();
    if (error) throw error;
    if (!data?.id) throw new Error("No shelter available for QA dog.");
    return data;
  });

  const uploaded = await step("upload_fake_image_to_storage", async () => {
    const body = await fs.readFile(imagePath);
    const { data, error } = await supabase.storage
      .from("dog-photos")
      .upload(storagePath, body, {
        cacheControl: "60",
        contentType: "image/jpeg",
        upsert: false,
      });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from("dog-photos").getPublicUrl(storagePath);
    return {
      publicUrl: publicData.publicUrl,
      storagePath: data.path,
    };
  });

  const dog = await step("insert_draft_dog", async () => {
    const { data, error } = await supabase
      .from("dogs")
      .insert({
        adoption_status: "draft",
        age_months: 18,
        background: "Synthetic QA dog created by Codex to test admin create/delete flow. Delete after test.",
        breed: "Mixed Breed",
        energy_level: "medium",
        gender: "unknown",
        good_with_cats: true,
        good_with_dogs: true,
        good_with_kids: true,
        name: dogName,
        shelter_id: shelter.id,
        size: "medium",
        special_needs: null,
        sterilized: false,
        weight_kg: 12,
      })
      .select("id, name, adoption_status, shelter_id")
      .single();
    if (error) throw error;
    dogId = data.id;
    return data;
  });

  const photo = await step("insert_cover_photo_row", async () => {
    const { data, error } = await supabase
      .from("dog_photos")
      .insert({
        dog_id: dog.id,
        is_cover: true,
        public_url: uploaded.publicUrl,
        sort_order: 0,
        storage_path: storagePath,
      })
      .select("id, dog_id, public_url, storage_path")
      .single();
    if (error) throw error;
    photoId = data.id;
    return data;
  });

  await step("set_cover_photo_id", async () => {
    const { error } = await supabase.from("dogs").update({ cover_photo_id: photo.id }).eq("id", dog.id);
    if (error) throw error;
    return { dogId: dog.id, photoId: photo.id };
  });

  await step("verify_created_rows", async () => {
    const [{ data: dogData, error: dogError }, { data: photoData, error: photoError }] = await Promise.all([
      supabase.from("dogs").select("id, name, adoption_status, cover_photo_id").eq("id", dog.id).single(),
      supabase.from("dog_photos").select("id, dog_id, public_url, storage_path").eq("dog_id", dog.id),
    ]);
    if (dogError) throw dogError;
    if (photoError) throw photoError;
    if (dogData.name !== dogName) throw new Error("Created dog verification returned wrong name.");
    if (!photoData?.length) throw new Error("Created photo verification returned no photos.");
    return { dog: dogData, photos: photoData };
  });
} finally {
  if (dogId) {
    await step("cleanup_delete_dog", async () => {
      const { error } = await supabase.from("dogs").delete().eq("id", dogId);
      if (error) throw error;
      log.cleanup.deletedDogId = dogId;
      return { dogId };
    }).catch((error) => {
      log.cleanup.deleteDogError = error instanceof Error ? error.message : String(error);
    });
  }

  await step("cleanup_remove_storage_object", async () => {
    const { data, error } = await supabase.storage.from("dog-photos").remove([storagePath]);
    if (error) throw error;
    log.cleanup.removedStoragePath = storagePath;
    return data;
  }).catch((error) => {
    log.cleanup.removeStorageError = error instanceof Error ? error.message : String(error);
  });

  if (dogId) {
    await step("verify_cleanup", async () => {
      const [{ data: dogData, error: dogError }, { data: photoData, error: photoError }] = await Promise.all([
        supabase.from("dogs").select("id").eq("id", dogId).maybeSingle(),
        supabase.from("dog_photos").select("id").eq("dog_id", dogId),
      ]);
      if (dogError) throw dogError;
      if (photoError) throw photoError;
      return {
        remainingDog: dogData ?? null,
        remainingPhotos: photoData?.length ?? 0,
      };
    });
  }

  log.endedAt = new Date().toISOString();
  log.createdDogId = dogId;
  log.createdPhotoId = photoId;
  await fs.writeFile(logPath, JSON.stringify(log, null, 2));
}

console.log(JSON.stringify(log, null, 2));
