"use server";

import { randomUUID } from "node:crypto";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { canAccessShelter } from "@/utils/admin-authorization";
import { createAdminClient } from "@/utils/supabase/admin";

const BUCKET = "dog-upload-staging";

export async function prepareDogMediaUpload(shelterId: string, name: string, size: number) {
  const context = await getAdminAuthContext();
  if (!context?.userId || !canAccessShelter({ role: context.role, shelterIds: context.shelterIds, targetShelterId: shelterId })) {
    throw new Error("Please sign in to your shelter and try again.");
  }
  const extension = name.split(".").pop()?.toLowerCase();
  if (!extension || !["jpg", "jpeg", "png", "webp", "heic", "heif", "mp4", "mov"].includes(extension) || !Number.isFinite(size) || size <= 0 || size > 50 * 1024 * 1024) {
    throw new Error("Choose a supported photo or MP4/MOV video under 50MB.");
  }
  const admin = createAdminClient();
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 50 * 1024 * 1024 });
    if (error && !(await admin.storage.getBucket(BUCKET)).data) throw new Error("Upload storage is unavailable. Please try again.");
  }
  const path = `${shelterId}/${context.userId}/${randomUUID()}.${extension}`;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error("Could not start the upload. Please try again.");
  return { path, signedUrl: data.signedUrl };
}
