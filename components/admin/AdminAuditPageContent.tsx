import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import { buildAdminLoginPath, getAdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AdminAuditEvent } from "@/types/database";

type ProfileSummary = {
  full_name: string | null;
  id: string;
};

type ShelterSummary = {
  id: string;
  name: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function actionLabel(action: string) {
  return action
    .split(".")
    .map((part) => part.replaceAll("_", " "))
    .join(" / ");
}

function metadataSummary(metadata: AdminAuditEvent["metadata"]) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const entries = Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (entries.length === 0) return "";

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" · ");
}

function isMissingAuditTableError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return message.includes("admin_audit_events")
    || message.includes("Could not find")
    || message.includes("schema cache")
    || message.includes("does not exist");
}

export async function AdminAuditPageContent({
  basePath = "/admin",
  lockedFallback,
}: {
  basePath?: "/admin" | "/admindraft";
  lockedFallback?: ReactNode;
}) {
  const adminContext = await getAdminAuthContext();

  if (!adminContext) {
    if (lockedFallback) return lockedFallback;
    redirect(buildAdminLoginPath(`${basePath}/audit`));
  }

  const admin = createAdminClient();
  const scopedShelterIds = adminContext.isGlobalAdmin ? null : adminContext.shelterIds;
  let events: AdminAuditEvent[] = [];
  let unavailable = false;

  if (!scopedShelterIds || scopedShelterIds.length > 0) {
    let query = admin
      .from("admin_audit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (scopedShelterIds) {
      query = query.in("shelter_id", scopedShelterIds);
    }

    const { data, error } = await query;
    unavailable = isMissingAuditTableError(error);
    if (error && !unavailable) {
      console.error("Admin audit events failed to load", error);
    }
    events = (data ?? []) as AdminAuditEvent[];
  }

  const actorIds = [...new Set(events.map((event) => event.actor_profile_id).filter(Boolean))] as string[];
  const shelterIds = [...new Set(events.map((event) => event.shelter_id).filter(Boolean))] as string[];
  const [{ data: profiles }, { data: shelters }] = await Promise.all([
    actorIds.length
      ? admin.from("profiles").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [] }),
    shelterIds.length
      ? admin.from("shelters").select("id, name").in("id", shelterIds)
      : Promise.resolve({ data: [] }),
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileSummary]));
  const shelterMap = new Map((shelters ?? []).map((shelter) => [shelter.id, shelter as ShelterSummary]));

  const pageContent = (
    <>
        {unavailable ? (
          <div className="rounded-[28px] border border-[#f1d8b5] bg-[#fff7ec] p-6 text-sm leading-6 text-[#8a5a1f]">
            Apply the admin audit migration before this page can show activity.
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[28px] border border-[#d6c8ad] bg-white p-6 text-sm leading-6 text-[#65584f] shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
            No audit events yet.
          </div>
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-4 border-b border-[#d6c8ad] bg-[#fffaf5] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f] md:grid-cols-[1.1fr_1fr_1fr_1.4fr]">
              <span>Action</span>
              <span>Actor</span>
              <span>Shelter</span>
              <span className="hidden md:block">Details</span>
            </div>
            <div className="divide-y divide-[#f0e2cf]">
              {events.map((event) => {
                const profile = event.actor_profile_id ? profileMap.get(event.actor_profile_id) : null;
                const shelter = event.shelter_id ? shelterMap.get(event.shelter_id) : null;
                const details = metadataSummary(event.metadata);

                return (
                  <article className="grid gap-4 px-5 py-4 text-sm text-[#65584f] md:grid-cols-[1.1fr_1fr_1fr_1.4fr]" key={event.id}>
                    <div>
                      <p className="font-semibold capitalize text-[#65584f]">{actionLabel(event.action)}</p>
                      <p className="mt-1 text-xs text-[#65584f]">{formatDateTime(event.created_at)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#65584f]">{profile?.full_name ?? event.actor_role}</p>
                      <p className="mt-1 text-xs text-[#65584f]">{event.actor_role.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#65584f]">{shelter?.name ?? "Platform"}</p>
                      <p className="mt-1 text-xs text-[#65584f]">{event.target_table ?? "record"}</p>
                    </div>
                    <p className="text-xs leading-5 text-[#65584f]">{details || event.target_id || "No extra metadata"}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}
    </>
  );

  if ((basePath === "/admin" || basePath === "/admindraft") && adminContext.isGlobalAdmin) {
    return (
      <PawjaiWorkspaceShell active="audit">
        <section className="mb-6 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">Audit</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#65584f]">Audit log</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65584f]/75">
            Review privileged changes across bookings, listings, shelter settings, ads, and PawJai content.
          </p>
        </section>
        {pageContent}
      </PawjaiWorkspaceShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#cd8188]">
              PawJai Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#65584f]">Audit Log</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65584f]">
              Review privileged admin changes across bookings, listings, shelter settings, ads, and PawJai content.
            </p>
          </div>
          <AdminWorkspaceNav
            active="audit"
            basePath={basePath}
            showAds={adminContext.isGlobalAdmin}
            showGlobalOnly={adminContext.isGlobalAdmin}
          />
        </div>
        {pageContent}
      </div>
    </main>
  );
}
