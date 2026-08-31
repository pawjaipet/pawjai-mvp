import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  Bookmark,
  Building2,
  CalendarCheck2,
  ChevronDown,
  Crown,
  Eye,
  KeyRound,
  LogIn,
  Mail,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import {
  createShelterPortalAccountAction,
  resetShelterPortalPasswordAction,
  revokeShelterPortalAccountAction,
} from "@/app/admin/accounts/shelter-actions";
import { getAdminAuthContext, requireGlobalAdmin } from "@/utils/admin-auth";
import {
  hasLaunchPremiumGrant,
  launchPremiumGrantNumber,
  subscriptionTierFromAppMetadata,
  type SubscriptionTier,
} from "@/utils/subscription-limits";
import { createAdminClient } from "@/utils/supabase/admin";
import type { ProductAnalyticsEvent } from "@/types/database";

type AccountTab = "users" | "shelters";

type ProfileSummary = {
  full_name: string | null;
  id: string;
  role: "admin" | "adopter" | "shelter_admin";
};

type AdopterSummary = {
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
  profile_id: string;
  verification_status: "approved" | "needs_updates" | "not_started" | "submitted";
};

type AppointmentSummary = {
  adopter_id: string;
  created_at: string;
  dog_id: string | null;
  id: string;
  status: string;
};

type DogSummary = {
  id: string;
  name: string;
};

type WishlistSummary = {
  adopter_id: string;
  created_at: string;
  dog_id: string;
};

type LaunchGrantSummary = {
  grant_number: number;
  user_id: string;
};

type BillingSubscriptionSummary = {
  status: string;
  tier: SubscriptionTier;
  user_id: string;
};

type ShelterSummary = {
  email: string | null;
  id: string;
  name: string;
};

type ShelterMembership = {
  profile_id: string;
  role: "owner" | "staff" | "viewer";
  shelter_id: string;
};

type PortalAccount = {
  profile_id: string;
  username: string;
};

type UserActivity = {
  bookingFailures: number;
  bookingStarts: number;
  dogShares: number;
  dogViews: number;
  feedImpressions: number;
  lastActivityAt: string | null;
  pageViews: number;
  total: number;
  viewedDogCounts: Map<string, number>;
};

type UserPlan = {
  detail: string;
  isFounding: boolean;
  label: string;
  tier: SubscriptionTier;
};

function parseTab(value: string | undefined): AccountTab {
  return value === "shelters" ? "shelters" : "users";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function providerLabel(user: User) {
  const provider = typeof user.app_metadata?.provider === "string"
    ? user.app_metadata.provider
    : user.identities?.[0]?.provider;
  return provider === "google" ? "Google" : "Email";
}

function accountName(user: User) {
  const metadataName = user.user_metadata?.user_name ?? user.user_metadata?.preferred_username;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "No username";
}

function displayName(user: User, profile?: ProfileSummary, adopter?: AdopterSummary) {
  if (profile?.full_name?.trim()) return profile.full_name.trim();
  const adopterName = [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ").trim();
  if (adopterName) return adopterName;
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : "Unnamed user";
}

function emptyUserActivity(): UserActivity {
  return {
    bookingFailures: 0,
    bookingStarts: 0,
    dogShares: 0,
    dogViews: 0,
    feedImpressions: 0,
    lastActivityAt: null,
    pageViews: 0,
    total: 0,
    viewedDogCounts: new Map<string, number>(),
  };
}

function subscriptionPlanForUser(
  user: User,
  grant?: LaunchGrantSummary,
  billing?: BillingSubscriptionSummary,
): UserPlan {
  const metadataGrantNumber = launchPremiumGrantNumber(user.app_metadata);
  const grantNumber = grant?.grant_number ?? metadataGrantNumber;
  const isFounding = Boolean(grant) || hasLaunchPremiumGrant(user.app_metadata);

  if (isFounding) {
    return {
      detail: grantNumber ? `Founding member #${grantNumber} of 200` : "Free founding member access",
      isFounding: true,
      label: "Founding Premium",
      tier: "premium",
    };
  }

  const tier = subscriptionTierFromAppMetadata(user.app_metadata);
  const label = tier === "premium" ? "Premium" : tier === "standard" ? "Standard" : "Free";
  return {
    detail: billing && billing.tier === tier ? `Billing ${billing.status.replaceAll("_", " ")}` : "Current account access",
    isFounding: false,
    label,
    tier,
  };
}

function planBadgeClass(plan: UserPlan) {
  if (plan.isFounding) return "bg-[#f8e8ea] text-[#a85f69] ring-[#e6aeb4]";
  if (plan.tier === "premium") return "bg-[#eee6f8] text-[#73518f] ring-[#cdb8df]";
  if (plan.tier === "standard") return "bg-[#fff1dc] text-[#8a5d17] ring-[#e8ca99]";
  return "bg-[#f2eee8] text-[#65584f] ring-[#d6c8ad]";
}

function verificationLabel(status: AdopterSummary["verification_status"] | undefined) {
  if (!status || status === "not_started") return "Not started";
  if (status === "needs_updates") return "Needs updates";
  return status === "approved" ? "Approved" : "Submitted";
}

async function loadAllUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw result.error;
    users.push(...result.data.users);
    if (result.data.users.length < 1000) break;
  }
  return users;
}

async function loadUserEvents() {
  const admin = createAdminClient();
  const events: ProductAnalyticsEvent[] = [];
  for (let offset = 0; offset < 50_000; offset += 1000) {
    const { data, error } = await admin
      .from("product_analytics_events")
      .select("id,event_name,visitor_id,session_id,user_id,dog_id,appointment_id,path,metadata,created_at")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) return { events: [] as ProductAnalyticsEvent[], unavailable: true };
    const rows = (data ?? []) as ProductAnalyticsEvent[];
    events.push(...rows);
    if (rows.length < 1000) break;
  }
  return { events, unavailable: false };
}

function MetricCard({
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[24px] border border-[#d6c8ad] bg-white p-5 shadow-[0_12px_34px_rgba(101,88,79,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]/65">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8e8ea] text-[#cd8188]">{icon}</span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-[#65584f]">{new Intl.NumberFormat("en-US").format(value)}</p>
      <p className="mt-2 text-xs leading-5 text-[#65584f]/65">{detail}</p>
    </article>
  );
}

async function UserAccountsTab({ basePath, query }: { basePath: string; query: string }) {
  const admin = createAdminClient();
  const [
    users,
    profilesResult,
    adoptersResult,
    appointmentsResult,
    dogsResult,
    wishlistsResult,
    grantsResult,
    billingResult,
    eventsResult,
  ] = await Promise.all([
    loadAllUsers(),
    admin.from("profiles").select("id,full_name,role"),
    admin.from("adopters").select("id,profile_id,first_name,last_name,email,verification_status"),
    admin.from("appointments").select("id,adopter_id,dog_id,status,created_at"),
    admin.from("dogs").select("id,name"),
    admin.from("wishlists").select("adopter_id,dog_id,created_at").order("created_at", { ascending: false }),
    admin.from("subscription_launch_grants").select("user_id,grant_number"),
    admin.from("billing_subscriptions").select("user_id,tier,status"),
    loadUserEvents(),
  ]);

  const profiles = (profilesResult.data ?? []) as ProfileSummary[];
  const adopters = (adoptersResult.data ?? []) as AdopterSummary[];
  const appointments = (appointmentsResult.data ?? []) as AppointmentSummary[];
  const dogs = (dogsResult.data ?? []) as DogSummary[];
  const wishlists = (wishlistsResult.data ?? []) as WishlistSummary[];
  const launchGrants = (grantsResult.data ?? []) as LaunchGrantSummary[];
  const billingSubscriptions = (billingResult.data ?? []) as BillingSubscriptionSummary[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const adopterMap = new Map(adopters.map((adopter) => [adopter.profile_id, adopter]));
  const adopterProfileById = new Map(adopters.map((adopter) => [adopter.id, adopter.profile_id]));
  const dogMap = new Map(dogs.map((dog) => [dog.id, dog.name]));
  const launchGrantMap = new Map(launchGrants.map((grant) => [grant.user_id, grant]));
  const billingMap = new Map(billingSubscriptions.map((subscription) => [subscription.user_id, subscription]));
  const wishlistsByUser = new Map<string, WishlistSummary[]>();
  for (const wishlist of wishlists) {
    const userId = adopterProfileById.get(wishlist.adopter_id);
    if (!userId) continue;
    const current = wishlistsByUser.get(userId) ?? [];
    current.push(wishlist);
    wishlistsByUser.set(userId, current);
  }
  const activityByUser = new Map<string, UserActivity>();

  for (const event of eventsResult.events) {
    if (!event.user_id) continue;
    const activity = activityByUser.get(event.user_id) ?? emptyUserActivity();
    activity.total += 1;
    if (!activity.lastActivityAt || event.created_at > activity.lastActivityAt) activity.lastActivityAt = event.created_at;
    if (event.event_name === "page_view") activity.pageViews += 1;
    if (event.event_name === "dog_feed_impression") activity.feedImpressions += 1;
    if (event.event_name === "dog_profile_view") {
      activity.dogViews += 1;
      if (event.dog_id) {
        activity.viewedDogCounts.set(event.dog_id, (activity.viewedDogCounts.get(event.dog_id) ?? 0) + 1);
      }
    }
    if (event.event_name === "dog_shared") activity.dogShares += 1;
    if (event.event_name === "booking_started") activity.bookingStarts += 1;
    if (event.event_name === "booking_failed") activity.bookingFailures += 1;
    activityByUser.set(event.user_id, activity);
  }

  const bookingsByUser = new Map<string, number>();
  for (const appointment of appointments) {
    const profileId = adopterProfileById.get(appointment.adopter_id);
    if (!profileId) continue;
    bookingsByUser.set(profileId, (bookingsByUser.get(profileId) ?? 0) + 1);
    const activity = activityByUser.get(profileId) ?? emptyUserActivity();
    if (!activity.lastActivityAt || appointment.created_at > activity.lastActivityAt) {
      activity.lastActivityAt = appointment.created_at;
    }
    activityByUser.set(profileId, activity);
  }

  const publicUsers = users.filter((user) => {
    const role = profileMap.get(user.id)?.role;
    return role !== "admin" && role !== "shelter_admin";
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = publicUsers
    .filter((user) => {
      if (!normalizedQuery) return true;
      const profile = profileMap.get(user.id);
      const adopter = adopterMap.get(user.id);
      const activity = activityByUser.get(user.id);
      const plan = subscriptionPlanForUser(user, launchGrantMap.get(user.id), billingMap.get(user.id));
      const dogNames = [
        ...(wishlistsByUser.get(user.id) ?? []).map((item) => dogMap.get(item.dog_id)),
        ...[...(activity?.viewedDogCounts.keys() ?? [])].map((dogId) => dogMap.get(dogId)),
      ];
      return [displayName(user, profile, adopter), accountName(user), user.email, adopter?.email, plan.label, ...dogNames]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => {
      const aTime = activityByUser.get(a.id)?.lastActivityAt ?? a.last_sign_in_at ?? a.created_at;
      const bTime = activityByUser.get(b.id)?.lastActivityAt ?? b.last_sign_in_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  const signedInUsers = publicUsers.filter((user) => Boolean(user.last_sign_in_at)).length;
  const confirmedUsers = publicUsers.filter((user) => Boolean(user.email_confirmed_at ?? user.confirmed_at)).length;
  const activeUsers = publicUsers.filter((user) => activityByUser.has(user.id) || bookingsByUser.has(user.id)).length;
  const createdIn30Days = publicUsers.filter((user) => Date.now() - new Date(user.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
  const googleUsers = publicUsers.filter((user) => providerLabel(user) === "Google").length;
  const premiumUsers = publicUsers.filter((user) => subscriptionPlanForUser(user, launchGrantMap.get(user.id), billingMap.get(user.id)).tier === "premium").length;
  const detailsUnavailable = Boolean(wishlistsResult.error || grantsResult.error || billingResult.error);

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="User account totals">
        <MetricCard detail={`${googleUsers} Google · ${publicUsers.length - googleUsers} email accounts`} icon={<Users className="h-5 w-5" />} label="User accounts" value={publicUsers.length} />
        <MetricCard detail={`${confirmedUsers} accounts have a confirmed email`} icon={<LogIn className="h-5 w-5" />} label="Have logged in" value={signedInUsers} />
        <MetricCard detail="Accounts with recorded page, dog, or booking activity" icon={<Activity className="h-5 w-5" />} label="Active users" value={activeUsers} />
        <MetricCard detail="Public adopter accounts created in the last 30 days" icon={<UserPlus className="h-5 w-5" />} label="New accounts" value={createdIn30Days} />
        <MetricCard detail={`${launchGrants.length} of 200 Founding Premium places assigned`} icon={<Crown className="h-5 w-5" />} label="Premium access" value={premiumUsers} />
      </section>

      {eventsResult.unavailable || detailsUnavailable ? (
        <div className="mt-5 rounded-[22px] border border-[#efc2be] bg-[#fff1f0] px-5 py-4 text-sm text-[#9a3129]">
          User accounts are live, but some interaction, wishlist, or subscription details are temporarily unavailable.
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
        <div className="flex flex-col gap-4 border-b border-[#eadfcd] bg-[#fffaf5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#65584f]">Public user accounts</h3>
            <p className="mt-1 text-xs text-[#65584f]/65">People using the adopter side of PawJai. Admin and shelter portal accounts are excluded.</p>
          </div>
          <form className="flex w-full max-w-md gap-2" method="get">
            <input name="tab" type="hidden" value="users" />
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65584f]/50" />
              <input className="w-full rounded-full border border-[#d6c8ad] bg-white py-2.5 pl-10 pr-4 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" defaultValue={query} name="q" placeholder="Search name, account, or email" />
            </label>
            <button className="rounded-full bg-[#cd8188] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">Search</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1.25fr_1.15fr_auto] gap-4 border-b border-[#eadfcd] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65584f]/60">
              <span>User</span><span>Account status</span><span>Subscription</span><span>Dog activity</span><span>Wishlist</span><span>Last active</span>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#65584f]/65">No public user accounts match this search.</p>
            ) : filteredUsers.map((user) => {
              const profile = profileMap.get(user.id);
              const adopter = adopterMap.get(user.id);
              const activity = activityByUser.get(user.id);
              const wishlist = wishlistsByUser.get(user.id) ?? [];
              const plan = subscriptionPlanForUser(user, launchGrantMap.get(user.id), billingMap.get(user.id));
              const viewedDogs = [...(activity?.viewedDogCounts.entries() ?? [])]
                .sort((a, b) => b[1] - a[1]);
              const wishlistNames = wishlist.map((item) => dogMap.get(item.dog_id) ?? "Removed dog");
              const lastActive = activity?.lastActivityAt ?? user.last_sign_in_at;
              return (
                <details className="group border-b border-[#eadfcd] last:border-b-0" key={user.id}>
                  <summary className="grid cursor-pointer list-none grid-cols-[1.4fr_1fr_1fr_1.25fr_1.15fr_auto] items-center gap-4 px-5 py-4 text-sm transition hover:bg-[#fffaf5] [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#65584f]">{displayName(user, profile, adopter)}</p>
                      <p className="mt-1 truncate text-xs text-[#65584f]/65">@{accountName(user)} · {user.email ?? adopter?.email ?? "No email"}</p>
                      <p className="mt-1 text-[11px] text-[#65584f]/50">Joined {formatDateTime(user.created_at)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#65584f]">{providerLabel(user)} · {user.email_confirmed_at ?? user.confirmed_at ? "Email confirmed" : "Email unconfirmed"}</p>
                      <p className="mt-1 text-xs text-[#65584f]/60">Adopter verification: {verificationLabel(adopter?.verification_status)}</p>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${planBadgeClass(plan)}`}>{plan.label}</span>
                      <p className="mt-2 text-xs text-[#65584f]/60">{plan.detail}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#65584f]">{activity?.dogViews ?? 0} profile opens · {viewedDogs.length} dogs</p>
                      <p className="mt-1 text-xs text-[#65584f]/60">{activity?.feedImpressions ?? 0} feed impressions · {activity?.dogShares ?? 0} shares</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#65584f]">{wishlist.length} saved dogs</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#65584f]/60">{wishlistNames.length ? wishlistNames.slice(0, 3).join(", ") : "Wishlist is empty"}</p>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <time className="whitespace-nowrap text-xs text-[#65584f]/60">{formatDateTime(lastActive)}</time>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#cd8188] transition group-open:rotate-180" aria-hidden="true" />
                    </div>
                  </summary>

                  <div className="grid gap-0 border-t border-[#eadfcd] bg-[#fffaf5] lg:grid-cols-3">
                    <section className="px-5 py-5 lg:border-r lg:border-[#eadfcd]" aria-label="Viewed dog profiles">
                      <div className="flex items-center gap-2 text-[#65584f]"><Eye className="h-4 w-4 text-[#cd8188]" /><h4 className="font-semibold">Viewed dog profiles</h4></div>
                      <p className="mt-1 text-xs text-[#65584f]/60">Profile opens are shown separately from feed impressions.</p>
                      {viewedDogs.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {viewedDogs.slice(0, 12).map(([dogId, count]) => (
                            <Link className="rounded-full border border-[#d6c8ad] bg-white px-3 py-1.5 text-xs font-medium text-[#65584f] hover:border-[#cd8188]" href={`/dogs/${dogId}`} key={dogId} target="_blank">
                              {dogMap.get(dogId) ?? "Removed dog"} · {count}
                            </Link>
                          ))}
                          {viewedDogs.length > 12 ? <span className="px-2 py-1.5 text-xs text-[#65584f]/60">+{viewedDogs.length - 12} more</span> : null}
                        </div>
                      ) : <p className="mt-4 text-sm text-[#65584f]/60">No tracked dog profile opens yet.</p>}
                    </section>

                    <section className="border-t border-[#eadfcd] px-5 py-5 lg:border-r lg:border-t-0 lg:border-[#eadfcd]" aria-label="Wishlist dogs">
                      <div className="flex items-center gap-2 text-[#65584f]"><Bookmark className="h-4 w-4 text-[#cd8188]" /><h4 className="font-semibold">Wishlist dogs</h4></div>
                      <p className="mt-1 text-xs text-[#65584f]/60">Current saved dogs, newest save first.</p>
                      {wishlist.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {wishlist.map((item) => (
                            <Link className="rounded-full border border-[#d6c8ad] bg-white px-3 py-1.5 text-xs font-medium text-[#65584f] hover:border-[#cd8188]" href={`/dogs/${item.dog_id}`} key={`${item.adopter_id}:${item.dog_id}`} target="_blank">
                              {dogMap.get(item.dog_id) ?? "Removed dog"}
                            </Link>
                          ))}
                        </div>
                      ) : <p className="mt-4 text-sm text-[#65584f]/60">No dogs are currently saved.</p>}
                    </section>

                    <section className="border-t border-[#eadfcd] px-5 py-5 lg:border-t-0" aria-label="Account journey">
                      <div className="flex items-center gap-2 text-[#65584f]"><Activity className="h-4 w-4 text-[#cd8188]" /><h4 className="font-semibold">Account journey</h4></div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                        <div><dt className="text-[#65584f]/55">Page views</dt><dd className="mt-1 font-semibold text-[#65584f]">{activity?.pageViews ?? 0}</dd></div>
                        <div><dt className="text-[#65584f]/55">Tracked events</dt><dd className="mt-1 font-semibold text-[#65584f]">{activity?.total ?? 0}</dd></div>
                        <div><dt className="text-[#65584f]/55">Visit requests</dt><dd className="mt-1 font-semibold text-[#65584f]">{bookingsByUser.get(user.id) ?? 0}</dd></div>
                        <div><dt className="text-[#65584f]/55">Booking starts</dt><dd className="mt-1 font-semibold text-[#65584f]">{activity?.bookingStarts ?? 0}</dd></div>
                        <div><dt className="text-[#65584f]/55">Booking failures</dt><dd className={`mt-1 font-semibold ${activity?.bookingFailures ? "text-[#9a3129]" : "text-[#65584f]"}`}>{activity?.bookingFailures ?? 0}</dd></div>
                        <div><dt className="text-[#65584f]/55">Last sign-in</dt><dd className="mt-1 font-semibold text-[#65584f]">{formatDateTime(user.last_sign_in_at)}</dd></div>
                        <div><dt className="text-[#65584f]/55">Last activity</dt><dd className="mt-1 font-semibold text-[#65584f]">{formatDateTime(lastActive)}</dd></div>
                      </dl>
                    </section>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
        <div className="border-t border-[#eadfcd] bg-[#fffaf5] px-5 py-3 text-xs text-[#65584f]/60">
          Showing {filteredUsers.length} of {publicUsers.length} user accounts. Detailed events are also available in <Link className="font-semibold text-[#b36f78] underline" href={`${basePath}/analytics`}>User analytics</Link>.
        </div>
      </section>
    </>
  );
}

async function ShelterAccountsTab({ basePath }: { basePath: string }) {
  const admin = createAdminClient();
  const [users, sheltersResult, membershipsResult, profilesResult, portalAccountsResult] = await Promise.all([
    loadAllUsers(),
    admin.from("shelters").select("id,name,email").order("name", { ascending: true }),
    admin.from("shelter_users").select("profile_id,shelter_id,role"),
    admin.from("profiles").select("id,full_name,role").eq("role", "shelter_admin"),
    (admin as any).from("shelter_portal_accounts").select("profile_id,username"),
  ]);
  const shelters = (sheltersResult.data ?? []) as ShelterSummary[];
  const memberships = (membershipsResult.data ?? []) as ShelterMembership[];
  const profiles = (profilesResult.data ?? []) as ProfileSummary[];
  const portalAccounts = (portalAccountsResult.data ?? []) as PortalAccount[];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const portalMap = new Map(portalAccounts.map((account) => [account.profile_id, account]));
  const membershipsByShelter = new Map<string, ShelterMembership[]>();
  for (const membership of memberships) {
    const current = membershipsByShelter.get(membership.shelter_id) ?? [];
    current.push(membership);
    membershipsByShelter.set(membership.shelter_id, current);
  }
  const sheltersWithoutAccounts = shelters.filter((shelter) => !(membershipsByShelter.get(shelter.id)?.length));
  const configuredAccounts = memberships.filter((membership) => portalMap.has(membership.profile_id)).length;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Shelter portal account totals">
        <MetricCard detail="Partner shelters in the PawJai database" icon={<Building2 className="h-5 w-5" />} label="Partner shelters" value={shelters.length} />
        <MetricCard detail="Accounts linked only to their assigned shelter portal" icon={<ShieldCheck className="h-5 w-5" />} label="Portal accounts" value={configuredAccounts} />
        <MetricCard detail="Shelters that still need a portal username and login" icon={<KeyRound className="h-5 w-5" />} label="Need access" value={sheltersWithoutAccounts.length} />
      </section>

      <div className="mt-6 rounded-[22px] border border-[#d7e7c7] bg-[#f4fbec] px-5 py-4 text-sm leading-6 text-[#46602e]">
        Shelter accounts sign in at <strong>/shelter</strong> and are authorized only for their linked shelter portal. They are not PawJai admin accounts and cannot open the management workspace.
      </div>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
        <div className="border-b border-[#eadfcd] bg-[#fffaf5] px-5 py-4">
          <h3 className="text-xl font-semibold text-[#65584f]">Shelter portal access</h3>
          <p className="mt-1 text-xs text-[#65584f]/65">Username and login email are visible. Passwords are securely hashed by Supabase Auth and can only be replaced, never recalled.</p>
        </div>
        <div className="divide-y divide-[#eadfcd]">
          {shelters.map((shelter) => {
            const shelterMemberships = membershipsByShelter.get(shelter.id) ?? [];
            return (
              <article className="px-5 py-5" key={shelter.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-[#65584f]">{shelter.name}</h4>
                    <p className="mt-1 text-xs text-[#65584f]/60">Shelter contact: {shelter.email ?? "No contact email set"}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${shelterMemberships.length ? "bg-[#edf7e5] text-[#46602e]" : "bg-[#fff1dc] text-[#8a5d17]"}`}>
                    {shelterMemberships.length ? "Portal ready" : "No portal account"}
                  </span>
                </div>

                {shelterMemberships.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] px-4 py-4 text-sm text-[#65584f]/65">Create this shelter&apos;s first login using the form below.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {shelterMemberships.map((membership) => {
                      const user = userMap.get(membership.profile_id);
                      const profile = profileMap.get(membership.profile_id);
                      const portal = portalMap.get(membership.profile_id);
                      return (
                        <div className="rounded-[20px] border border-[#eadfcd] bg-[#fffaf5] p-4" key={`${shelter.id}-${membership.profile_id}`}>
                          <div className="grid gap-4 text-sm md:grid-cols-[1fr_1fr_0.8fr_auto] md:items-center">
                            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65584f]/55">Username</p><p className="mt-1 font-semibold text-[#65584f]">{portal?.username ?? "Not configured"}</p></div>
                            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65584f]/55">Login email</p><p className="mt-1 break-all font-semibold text-[#65584f]">{user?.email ?? "No email"}</p></div>
                            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65584f]/55">Last sign-in</p><p className="mt-1 font-semibold text-[#65584f]">{formatDateTime(user?.last_sign_in_at)}</p></div>
                            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65584f]/55">Access</p><p className="mt-1 font-semibold capitalize text-[#65584f]">{membership.role}</p></div>
                          </div>
                          <div className="mt-3 flex flex-col gap-3 border-t border-[#eadfcd] pt-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2 text-xs text-[#65584f]/65"><KeyRound className="h-4 w-4 text-[#cd8188]" /><span>Password is protected and cannot be displayed.</span></div>
                            <div className="flex flex-wrap gap-2">
                              <details className="group">
                                <summary className="cursor-pointer list-none rounded-full border border-[#d6c8ad] bg-white px-4 py-2 text-xs font-semibold text-[#65584f] hover:bg-[#f8e8ea]">Reset password</summary>
                                <form action={resetShelterPortalPasswordAction} className="mt-3 grid gap-3 rounded-[18px] border border-[#d6c8ad] bg-white p-4 sm:grid-cols-2 lg:min-w-[520px]">
                                  <input name="profileId" type="hidden" value={membership.profile_id} />
                                  <input name="shelterId" type="hidden" value={shelter.id} />
                                  <input name="returnTo" type="hidden" value={`${basePath}/accounts`} />
                                  <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]/60">New password</span><input autoComplete="new-password" className="w-full rounded-xl border border-[#d6c8ad] px-3 py-2 text-sm outline-none focus:border-[#cd8188]" minLength={12} name="password" required type="password" /></label>
                                  <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]/60">Repeat password</span><input autoComplete="new-password" className="w-full rounded-xl border border-[#d6c8ad] px-3 py-2 text-sm outline-none focus:border-[#cd8188]" minLength={12} name="confirmPassword" required type="password" /></label>
                                  <button className="rounded-full bg-[#cd8188] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b87179] sm:col-span-2" type="submit">Save replacement password</button>
                                </form>
                              </details>
                              <form action={revokeShelterPortalAccountAction}>
                                <input name="profileId" type="hidden" value={membership.profile_id} />
                                <input name="shelterId" type="hidden" value={shelter.id} />
                                <input name="returnTo" type="hidden" value={`${basePath}/accounts`} />
                                <button className="rounded-full border border-[#efc2be] bg-white px-4 py-2 text-xs font-semibold text-[#9a3129] hover:bg-[#fff1f0]" type="submit">Revoke portal access</button>
                              </form>
                            </div>
                          </div>
                          {profile?.full_name ? <p className="mt-3 text-xs text-[#65584f]/55">Account label: {profile.full_name}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8e8ea] text-[#cd8188]"><KeyRound className="h-5 w-5" /></span>
          <div><h3 className="text-xl font-semibold text-[#65584f]">Create shelter portal login</h3><p className="mt-1 text-sm text-[#65584f]/65">This creates access to the selected shelter&apos;s own portal only. It does not create PawJai admin access.</p></div>
        </div>
        {sheltersWithoutAccounts.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-[#d7e7c7] bg-[#f4fbec] px-4 py-3 text-sm text-[#46602e]">Every partner shelter already has portal access.</p>
        ) : (
          <form action={createShelterPortalAccountAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input name="returnTo" type="hidden" value={`${basePath}/accounts`} />
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]/65">Shelter</span><select className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="shelterId" required><option value="">Choose shelter</option>{sheltersWithoutAccounts.map((shelter) => <option key={shelter.id} value={shelter.id}>{shelter.name}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]/65">Username</span><input autoCapitalize="none" autoComplete="username" className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="username" pattern="[a-z0-9][a-z0-9_-]{2,39}" placeholder="sheltername" required /></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]/65">Login email</span><input autoComplete="email" className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="email" required type="email" /></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]/65">Account label</span><input className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" name="fullName" placeholder="Shared shelter login" /></label>
            <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]/65">Initial password</span><input autoComplete="new-password" className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" minLength={12} name="password" required type="password" /><span className="mt-1 block text-[11px] text-[#65584f]/55">At least 12 characters. It will not be shown again.</span></label>
            <div className="flex items-end"><button className="w-full rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">Create shelter login</button></div>
          </form>
        )}
      </section>
    </>
  );
}

export async function AdminAccountsPageContent({
  basePath = "/admin",
  lockedFallback,
  searchParams,
}: {
  basePath?: "/admin" | "/admindraft";
  lockedFallback?: ReactNode;
  searchParams?: Promise<{ message?: string; q?: string; tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedTab = parseTab(params.tab);
  const returnPath = `${basePath}/accounts?tab=${selectedTab}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;
  const adminContext = await getAdminAuthContext();
  if (!adminContext) {
    if (lockedFallback) return lockedFallback;
    await requireGlobalAdmin(returnPath);
    return null;
  }
  if (!adminContext.isGlobalAdmin) redirect(basePath);

  const body = (
    <>
      {params.message ? (
        <div className="mb-6 rounded-[22px] border border-[#d7e7c7] bg-[#f4fbec] px-5 py-4 text-sm text-[#46602e]">{params.message}</div>
      ) : null}

      <nav className="mb-6 grid gap-3 rounded-[28px] border border-[#d6c8ad] bg-white p-3 shadow-[0_14px_42px_rgba(101,88,79,0.07)] sm:grid-cols-2" aria-label="Account type">
        <Link className={`flex min-h-20 items-center gap-4 rounded-[20px] px-5 py-4 transition ${selectedTab === "users" ? "bg-[#f8e8ea] text-[#65584f] ring-1 ring-[#cd8188]" : "bg-[#fffaf5] text-[#65584f] hover:bg-[#f8e8ea]/60"}`} href={`${basePath}/accounts?tab=users`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#cd8188]"><Users className="h-5 w-5" /></span>
          <span><strong className="block text-base">User accounts</strong><span className="mt-1 block text-xs opacity-65">Adopter sign-ins and activity</span></span>
        </Link>
        <Link className={`flex min-h-20 items-center gap-4 rounded-[20px] px-5 py-4 transition ${selectedTab === "shelters" ? "bg-[#f8e8ea] text-[#65584f] ring-1 ring-[#cd8188]" : "bg-[#fffaf5] text-[#65584f] hover:bg-[#f8e8ea]/60"}`} href={`${basePath}/accounts?tab=shelters`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#cd8188]"><Building2 className="h-5 w-5" /></span>
          <span><strong className="block text-base">Shelter accounts</strong><span className="mt-1 block text-xs opacity-65">Partner portal access only</span></span>
        </Link>
      </nav>

      {selectedTab === "users"
        ? <UserAccountsTab basePath={basePath} query={params.q ?? ""} />
        : <ShelterAccountsTab basePath={basePath} />}
    </>
  );

  if (basePath === "/admin" || basePath === "/admindraft") {
    return (
      <PawjaiWorkspaceShell active="accounts">
        <section className="mb-6 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">Accounts</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-3xl font-semibold text-[#65584f]">People using PawJai</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#65584f]/75">Review public user accounts and interaction history separately from partner shelter portal access.</p></div>
            <div className="flex flex-wrap gap-3 text-xs text-[#65584f]/65"><span className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#cd8188]" />Live Supabase Auth data</span><span className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4 text-[#cd8188]" />Live booking activity</span><span className="flex items-center gap-2"><Eye className="h-4 w-4 text-[#cd8188]" />Tracked profile views</span></div>
          </div>
        </section>
        {body}
      </PawjaiWorkspaceShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium uppercase tracking-[0.24em] text-[#cd8188]">PawJai Admin</p><h1 className="mt-2 text-4xl font-semibold text-[#65584f]">Accounts</h1></div><AdminWorkspaceNav active="accounts" basePath={basePath} /></div>
        {body}
      </div>
    </main>
  );
}
