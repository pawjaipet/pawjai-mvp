import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav";
import { getAdminAuthContext, requireGlobalAdmin } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createAdminAccountAction, revokeAdminAccountAction } from "@/app/admin/accounts/actions";

type AdminProfile = {
  full_name: string | null;
  id: string;
  role: "admin" | "shelter_admin";
};

type ShelterUser = {
  profile_id: string;
  shelter_id: string;
};

export async function AdminAccountsPageContent({
  basePath = "/admin",
  lockedFallback,
  searchParams,
}: {
  basePath?: "/admin" | "/admindraft";
  lockedFallback?: ReactNode;
  searchParams?: Promise<{ message?: string }>;
}) {
  const adminContext = await getAdminAuthContext();
  if (!adminContext) {
    if (lockedFallback) return lockedFallback;
    await requireGlobalAdmin(`${basePath}/accounts`);
    return null;
  }
  if (!adminContext.isGlobalAdmin) {
    redirect(basePath);
  }

  const { message } = (await searchParams) ?? {};
  const supabase = createAdminClient();
  const [{ data: profiles }, { data: shelters }, { data: memberships }, usersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "shelter_admin"])
      .order("updated_at", { ascending: false }),
    supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase.from("shelter_users").select("profile_id, shelter_id"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const emailMap = new Map(usersResult.data.users.map((user) => [user.id, user.email ?? "No email"]));
  const shelterMap = new Map((shelters ?? []).map((shelter) => [shelter.id, shelter.name]));
  const membershipsByProfile = new Map<string, string[]>();
  for (const membership of (memberships ?? []) as ShelterUser[]) {
    const names = membershipsByProfile.get(membership.profile_id) ?? [];
    names.push(shelterMap.get(membership.shelter_id) ?? "Unknown shelter");
    membershipsByProfile.set(membership.profile_id, names);
  }
  const adminProfiles = (profiles ?? []) as AdminProfile[];

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#cd8188]">
              PawJai Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#65584f]">Admin Accounts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65584f]">
              Create PawJai admin accounts or one shared shelter account per partner shelter.
            </p>
          </div>
          <AdminWorkspaceNav active="accounts" basePath={basePath} />
        </div>

        {message ? (
          <div className="mb-6 rounded-2xl border border-[#d7e7c7] bg-[#f4fbec] px-4 py-3 text-sm text-[#46602e]">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
            <div className="border-b border-[#d6c8ad] bg-[#fffaf5] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#65584f]">Current admin access</h2>
            </div>
            <div className="divide-y divide-[#f0e2cf]">
              {adminProfiles.length === 0 ? (
                <p className="p-5 text-sm text-[#65584f]">No admin profiles found.</p>
              ) : adminProfiles.map((profile) => (
                <article className="grid gap-4 px-5 py-4 text-sm md:grid-cols-[1fr_1fr_auto]" key={profile.id}>
                  <div>
                    <p className="font-semibold text-[#65584f]">{profile.full_name || emailMap.get(profile.id) || "Admin user"}</p>
                    <p className="mt-1 text-xs text-[#65584f]">{emailMap.get(profile.id) ?? profile.id}</p>
                  </div>
                  <div>
                    <p className="font-semibold capitalize text-[#65584f]">{profile.role.replace("_", " ")}</p>
                    <p className="mt-1 text-xs text-[#65584f]">
                      {profile.role === "admin" ? "All shelters" : membershipsByProfile.get(profile.id)?.join(", ") || "No shelter linked"}
                    </p>
                  </div>
                  <form action={revokeAdminAccountAction}>
                    <input name="profileId" type="hidden" value={profile.id} />
                    <input name="returnTo" type="hidden" value={`${basePath}/accounts`} />
                    <button className="rounded-full border border-[#f1c4c0] px-4 py-2 text-xs font-semibold text-[#9a3129] hover:bg-[#fff5f4]" type="submit">
                      Revoke
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <aside>
            <form action={createAdminAccountAction} className="space-y-4 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
              <h2 className="text-lg font-semibold text-[#65584f]">Create admin login</h2>
              <input name="returnTo" type="hidden" value={`${basePath}/accounts`} />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Email</span>
                <input className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="email" required type="email" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Display name</span>
                <input className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="fullName" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Temporary password</span>
                <input className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" minLength={12} name="password" required type="password" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Role</span>
                <select className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" defaultValue="shelter_admin" name="role">
                  <option value="shelter_admin">Shelter admin</option>
                  <option value="admin">PawJai admin</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Shelter</span>
                <select className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="shelterId">
                  <option value="">Only required for shelter admins</option>
                  {(shelters ?? []).map((shelter) => (
                    <option key={shelter.id} value={shelter.id}>{shelter.name}</option>
                  ))}
                </select>
              </label>
              <button className="w-full rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">
                Create account
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
