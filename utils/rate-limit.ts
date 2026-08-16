import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

type RateLimitInput = {
  action: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isMissingRateLimitTableError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return message.includes("rate_limit_buckets")
    || message.includes("Could not find")
    || message.includes("schema cache")
    || message.includes("does not exist");
}

function isUniqueConflictError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return error?.code === "23505" || message.includes("duplicate key");
}

export async function getRequestIdentifier(fallback = "anonymous") {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  return forwardedFor || realIp || fallback;
}

export async function assertRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
}: RateLimitInput) {
  const normalizedIdentifier = identifier.trim().toLowerCase() || "anonymous";
  const identifierHash = hashIdentifier(`${action}:${normalizedIdentifier}`);
  const bucketKey = `${action}:${identifierHash}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error: insertError } = await admin.from("rate_limit_buckets").insert({
      action,
      bucket_key: bucketKey,
      count: 1,
      identifier_hash: identifierHash,
      reset_at: resetAt,
      updated_at: now.toISOString(),
    });

    if (!insertError) {
      return;
    }

    if (isMissingRateLimitTableError(insertError)) {
      console.warn("Rate limit table is not available yet; allowing request.", { action });
      return;
    }

    if (!isUniqueConflictError(insertError)) {
      throw new Error("Rate limit could not be updated.");
    }

    const { data: existing, error: readError } = await admin
      .from("rate_limit_buckets")
      .select("count, reset_at")
      .eq("bucket_key", bucketKey)
      .maybeSingle();

    if (readError) {
      if (isMissingRateLimitTableError(readError)) {
        console.warn("Rate limit table is not available yet; allowing request.", { action });
        return;
      }
      throw new Error("Rate limit could not be checked.");
    }

    if (!existing) {
      continue;
    }

    const expired = new Date(existing.reset_at) <= now;
    if (!expired && existing.count >= limit) {
      throw new Error("Too many attempts. Please wait a bit and try again.");
    }

    const { data: updated, error: updateError } = await admin
      .from("rate_limit_buckets")
      .update({
        count: expired ? 1 : existing.count + 1,
        reset_at: expired ? resetAt : existing.reset_at,
        updated_at: now.toISOString(),
      })
      .eq("bucket_key", bucketKey)
      .eq("count", existing.count)
      .select("bucket_key");

    if (updateError) {
      if (isMissingRateLimitTableError(updateError)) {
        console.warn("Rate limit table is not available yet; allowing request.", { action });
        return;
      }
      throw new Error("Rate limit could not be updated.");
    }

    if (updated?.length) {
      return;
    }
  }

  throw new Error("Rate limit could not be updated.");
}
