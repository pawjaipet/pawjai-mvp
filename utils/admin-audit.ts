import "server-only";

import type { Json } from "@/types/database";
import type { AdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

type AdminAuditEventInput = {
  action: string;
  context: AdminAuthContext;
  metadata?: Json;
  shelterId?: string | null;
  targetId?: string | null;
  targetTable?: string | null;
};

export async function logAdminAuditEvent({
  action,
  context,
  metadata = {},
  shelterId = null,
  targetId = null,
  targetTable = null,
}: AdminAuditEventInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit_events").insert({
    action,
    actor_profile_id: context.userId,
    actor_role: context.role,
    metadata,
    shelter_id: shelterId,
    target_id: targetId,
    target_table: targetTable,
  });

  if (error) {
    console.error("Failed to write admin audit event", {
      action,
      error,
      shelterId,
      targetId,
      targetTable,
    });
  }
}
