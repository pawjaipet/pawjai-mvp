import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  Eye,
  MousePointerClick,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { ProductAnalyticsEvent } from "@/types/database";

type AnalyticsRange = "7d" | "30d" | "all";

type AnalyticsEvent = ProductAnalyticsEvent;

type AdopterSummary = {
  profile_id: string;
  verification_status: "approved" | "needs_updates" | "not_started" | "submitted";
};

type ProfileSummary = {
  full_name: string | null;
  id: string;
  role: "admin" | "adopter" | "shelter_admin";
};

type DogSummary = {
  id: string;
  name: string;
  shelter_id: string;
};

type AppointmentSummary = {
  created_at: string;
  dog_id: string | null;
  id: string;
  status: string;
};

const RANGE_OPTIONS: Array<{ label: string; value: AnalyticsRange }> = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All recorded", value: "all" },
];

function parseRange(value: string | undefined): AnalyticsRange {
  return value === "30d" || value === "all" ? value : "7d";
}

function rangeStart(range: AnalyticsRange) {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function inRange(value: string, start: Date | null) {
  return !start || new Date(value).getTime() >= start.getTime();
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function providerLabel(user: User) {
  const provider = typeof user.app_metadata?.provider === "string"
    ? user.app_metadata.provider
    : user.identities?.[0]?.provider;
  return provider === "google" ? "Google" : "Email";
}

function viewerKey(event: AnalyticsEvent) {
  if (event.user_id) return `user:${event.user_id}`;
  if (event.visitor_id) return `visitor:${event.visitor_id}`;
  if (event.session_id) return `session:${event.session_id}`;
  return null;
}

function failureReasonLabel(value: unknown) {
  const labels: Record<string, string> = {
    database_error: "Database error",
    dog_not_found: "Dog profile unavailable",
    dog_unavailable: "Dog no longer available",
    missing_date_or_time: "Date or time missing",
    rate_limited: "Too many attempts",
    signed_out: "Not signed in",
    slot_taken: "Visit slot already taken",
    slot_unavailable: "Visit slot unavailable",
  };
  return typeof value === "string" ? labels[value] ?? value.replaceAll("_", " ") : "Unknown reason";
}

function eventFailureReason(event: AnalyticsEvent) {
  if (!event.metadata || typeof event.metadata !== "object" || Array.isArray(event.metadata)) return null;
  return event.metadata.reason;
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

async function loadEvents(start: Date | null) {
  const admin = createAdminClient();
  const events: AnalyticsEvent[] = [];

  for (let offset = 0; offset < 50_000; offset += 1000) {
    let query = admin
      .from("product_analytics_events")
      .select("id,event_name,visitor_id,session_id,user_id,dog_id,appointment_id,path,metadata,created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (start) query = query.gte("created_at", start.toISOString());

    const { data, error } = await query;
    if (error) return { events: [] as AnalyticsEvent[], unavailable: true };
    const rows = (data ?? []) as AnalyticsEvent[];
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
  value: number | string;
}) {
  return (
    <article className="min-w-0 rounded-[24px] border border-[#d6c8ad] bg-white p-5 shadow-[0_12px_34px_rgba(101,88,79,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]/65">{label}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8e8ea] text-[#cd8188]">
          {icon}
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-[#65584f]">{typeof value === "number" ? formatNumber(value) : value}</p>
      <p className="mt-2 text-xs leading-5 text-[#65584f]/65">{detail}</p>
    </article>
  );
}

export async function AdminUserAnalyticsPageContent({
  lockedFallback,
  searchParams,
}: {
  lockedFallback?: ReactNode;
  searchParams?: Promise<{ range?: string }>;
}) {
  const adminContext = await getAdminAuthContext();
  if (!adminContext) return lockedFallback ?? null;
  if (!adminContext.isGlobalAdmin) redirect("/admindraft");

  const selectedRange = parseRange((await searchParams)?.range);
  const start = rangeStart(selectedRange);
  const admin = createAdminClient();
  const [users, eventsResult, profilesResult, adoptersResult, dogsResult, appointmentsResult] = await Promise.all([
    loadAllUsers(),
    loadEvents(start),
    admin.from("profiles").select("id,full_name,role"),
    admin.from("adopters").select("profile_id,verification_status"),
    admin.from("dogs").select("id,name,shelter_id"),
    start
      ? admin.from("appointments").select("id,dog_id,status,created_at").gte("created_at", start.toISOString())
      : admin.from("appointments").select("id,dog_id,status,created_at"),
  ]);

  const profiles = (profilesResult.data ?? []) as ProfileSummary[];
  const adopters = (adoptersResult.data ?? []) as AdopterSummary[];
  const dogs = (dogsResult.data ?? []) as DogSummary[];
  const appointments = (appointmentsResult.data ?? []) as AppointmentSummary[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const adopterMap = new Map(adopters.map((adopter) => [adopter.profile_id, adopter]));
  const dogMap = new Map(dogs.map((dog) => [dog.id, dog]));
  const adopterUsers = users.filter((user) => {
    const role = profileMap.get(user.id)?.role;
    return role !== "admin" && role !== "shelter_admin";
  });
  const newAccounts = adopterUsers
    .filter((user) => inRange(user.created_at, start))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const events = eventsResult.events;
  const pageViews = events.filter((event) => event.event_name === "page_view");
  const dogViews = events.filter((event) => event.event_name === "dog_profile_view");
  const bookingStarts = events.filter((event) => event.event_name === "booking_started");
  const bookingSuccesses = events.filter((event) => event.event_name === "booking_succeeded");
  const bookingFailures = events.filter((event) => event.event_name === "booking_failed");
  const uniqueVisitors = new Set(events.map(viewerKey).filter(Boolean)).size;
  const approvedAdopters = adopterUsers.filter((user) => adopterMap.get(user.id)?.verification_status === "approved").length;
  const submittedAdopters = adopterUsers.filter((user) => adopterMap.get(user.id)?.verification_status === "submitted").length;
  const confirmedAccounts = adopterUsers.filter((user) => Boolean(user.email_confirmed_at ?? user.confirmed_at)).length;
  const googleAccounts = adopterUsers.filter((user) => providerLabel(user) === "Google").length;
  const emailAccounts = adopterUsers.length - googleAccounts;

  const dogMetrics = new Map<string, { bookingStarts: number; failures: number; uniqueViewers: Set<string>; views: number }>();
  for (const event of events) {
    if (!event.dog_id) continue;
    const current = dogMetrics.get(event.dog_id) ?? { bookingStarts: 0, failures: 0, uniqueViewers: new Set<string>(), views: 0 };
    if (event.event_name === "dog_profile_view") {
      current.views += 1;
      const key = viewerKey(event);
      if (key) current.uniqueViewers.add(key);
    }
    if (event.event_name === "booking_started") current.bookingStarts += 1;
    if (event.event_name === "booking_failed") current.failures += 1;
    dogMetrics.set(event.dog_id, current);
  }
  const appointmentsByDog = new Map<string, number>();
  for (const appointment of appointments) {
    if (!appointment.dog_id) continue;
    appointmentsByDog.set(appointment.dog_id, (appointmentsByDog.get(appointment.dog_id) ?? 0) + 1);
  }
  const topDogs = [...dogMetrics.entries()]
    .map(([dogId, metric]) => ({
      ...metric,
      appointments: appointmentsByDog.get(dogId) ?? 0,
      dog: dogMap.get(dogId),
    }))
    .sort((a, b) => b.views - a.views || b.bookingStarts - a.bookingStarts)
    .slice(0, 12);

  const pathCounts = new Map<string, number>();
  for (const event of pageViews) pathCounts.set(event.path, (pathCounts.get(event.path) ?? 0) + 1);
  const topPages = [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const failureCounts = new Map<string, number>();
  for (const event of bookingFailures) {
    const reason = failureReasonLabel(eventFailureReason(event));
    failureCounts.set(reason, (failureCounts.get(reason) ?? 0) + 1);
  }
  const topFailureReasons = [...failureCounts.entries()].sort((a, b) => b[1] - a[1]);
  const recentDogViews = dogViews.slice(0, 25);
  const trackingSince = events.length > 0 ? events[events.length - 1]?.created_at : null;
  const bookingConversion = bookingStarts.length > 0
    ? `${Math.round((bookingSuccesses.length / bookingStarts.length) * 100)}%`
    : "—";

  return (
    <PawjaiWorkspaceShell active="analytics">
        <section className="mb-6 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">User analytics</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[#65584f]">Launch activity</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65584f]/75">
                Visitor traffic, adopter accounts, dog profile interest, verification, and the booking funnel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Analytics date range">
              {RANGE_OPTIONS.map((option) => (
                <Link
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${selectedRange === option.value ? "bg-[#cd8188] text-white" : "border border-[#d6c8ad] bg-[#fffaf5] text-[#65584f] hover:bg-[#f8e8ea]"}`}
                  href={`/admindraft/analytics?range=${option.value}`}
                  key={option.value}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-6 rounded-[22px] border border-[#d6c8ad] bg-[#fffaf5] px-5 py-4 text-sm leading-6 text-[#65584f]/75">
          Account, verification, and appointment history comes from existing Supabase records. Interaction tracking starts when this release is deployed and stores no IP address, user agent, or browser fingerprint.
          {trackingSince ? ` Current event history begins ${formatDateTime(trackingSince)}.` : " No interaction events have arrived yet."}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Launch metrics">
          <MetricCard detail="Anonymous and signed-in visitors with activity in this period." icon={<Activity className="h-5 w-5" />} label="Unique visitors" value={uniqueVisitors} />
          <MetricCard detail={`${formatNumber(adopterUsers.length)} adopter accounts exist in total.`} icon={<UserPlus className="h-5 w-5" />} label="New accounts" value={newAccounts.length} />
          <MetricCard detail={`${formatNumber(dogViews.length)} dog profile views in this period.`} icon={<Eye className="h-5 w-5" />} label="Page views" value={pageViews.length} />
          <MetricCard detail={`${formatNumber(bookingFailures.length)} recorded failures · ${bookingConversion} tracked conversion.`} icon={<CalendarCheck2 className="h-5 w-5" />} label="Bookings created" value={appointments.length} />
        </section>

        {eventsResult.unavailable ? (
          <div className="mt-6 rounded-[24px] border border-[#efc2be] bg-[#fff1f0] p-5 text-sm leading-6 text-[#9a3129]">
            Interaction analytics is waiting for the product analytics migration. Account and appointment metrics above are still live.
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
            <div className="border-b border-[#eadfcd] px-5 py-4">
              <h2 className="text-xl font-semibold">Most viewed dog profiles</h2>
              <p className="mt-1 text-xs text-[#65584f]/65">Views and movement toward a visit request.</p>
            </div>
            {topDogs.length === 0 ? (
              <p className="p-5 text-sm text-[#65584f]/65">Dog profile views will appear here after this release receives traffic.</p>
            ) : (
              <div className="divide-y divide-[#eadfcd]">
                {topDogs.map((item, index) => (
                  <article className="grid grid-cols-[32px_minmax(0,1fr)_repeat(3,70px)] items-center gap-3 px-5 py-4 text-sm" key={item.dog?.id ?? index}>
                    <span className="font-semibold text-[#cd8188]">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.dog?.name ?? "Removed dog profile"}</p>
                      <p className="mt-1 text-xs text-[#65584f]/60">{item.uniqueViewers.size} unique viewers</p>
                    </div>
                    <div className="text-right"><p className="font-semibold">{item.views}</p><p className="text-[10px] uppercase text-[#65584f]/55">views</p></div>
                    <div className="text-right"><p className="font-semibold">{item.bookingStarts}</p><p className="text-[10px] uppercase text-[#65584f]/55">starts</p></div>
                    <div className="text-right"><p className="font-semibold">{item.appointments}</p><p className="text-[10px] uppercase text-[#65584f]/55">booked</p></div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-[#cd8188]" />
              <h2 className="text-xl font-semibold">Account health</h2>
            </div>
            <dl className="mt-5 divide-y divide-[#eadfcd] text-sm">
              {[
                ["Total adopter accounts", adopterUsers.length],
                ["Email confirmed", confirmedAccounts],
                ["Google sign-in", googleAccounts],
                ["Email sign-in", emailAccounts],
                ["Verification submitted", submittedAdopters],
                ["Verification approved", approvedAdopters],
              ].map(([label, value]) => (
                <div className="flex items-center justify-between gap-4 py-3" key={String(label)}>
                  <dt className="text-[#65584f]/70">{label}</dt>
                  <dd className="font-semibold text-[#65584f]">{formatNumber(Number(value))}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
            <div className="flex items-center gap-3"><MousePointerClick className="h-5 w-5 text-[#cd8188]" /><h2 className="text-xl font-semibold">Top public pages</h2></div>
            <div className="mt-4 divide-y divide-[#eadfcd]">
              {topPages.length === 0 ? <p className="py-3 text-sm text-[#65584f]/65">No page views recorded yet.</p> : topPages.map(([path, count]) => (
                <div className="flex items-center justify-between gap-4 py-3 text-sm" key={path}>
                  <code className="truncate text-[#65584f]/75">{path}</code>
                  <span className="shrink-0 font-semibold">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
            <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#cd8188]" /><h2 className="text-xl font-semibold">Booking friction</h2></div>
            <div className="mt-4 divide-y divide-[#eadfcd]">
              {topFailureReasons.length === 0 ? <p className="py-3 text-sm text-[#65584f]/65">No booking failures recorded in this period.</p> : topFailureReasons.map(([reason, count]) => (
                <div className="flex items-center justify-between gap-4 py-3 text-sm" key={reason}>
                  <span className="text-[#65584f]/75">{reason}</span>
                  <span className="font-semibold text-[#9a3129]">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
          <div className="border-b border-[#eadfcd] px-5 py-4">
            <h2 className="text-xl font-semibold">Recent dog profile viewers</h2>
            <p className="mt-1 text-xs text-[#65584f]/65">Signed-in viewers are identified; everyone else remains anonymous.</p>
          </div>
          {recentDogViews.length === 0 ? (
            <p className="p-5 text-sm text-[#65584f]/65">No dog profile views recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#eadfcd]">
              {recentDogViews.map((event) => {
                const user = event.user_id ? users.find((candidate) => candidate.id === event.user_id) : null;
                const profile = event.user_id ? profileMap.get(event.user_id) : null;
                return (
                  <article className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1.1fr_1fr_auto]" key={event.id}>
                    <div><p className="font-semibold">{profile?.full_name || user?.email || "Anonymous visitor"}</p><p className="mt-1 text-xs text-[#65584f]/60">{user?.email ?? "No personal identity stored"}</p></div>
                    <div><p className="font-semibold">{event.dog_id ? dogMap.get(event.dog_id)?.name ?? "Removed dog profile" : "Unknown dog"}</p><p className="mt-1 text-xs text-[#65584f]/60">{event.path}</p></div>
                    <time className="text-xs text-[#65584f]/60">{formatDateTime(event.created_at)}</time>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white shadow-[0_14px_42px_rgba(101,88,79,0.07)]">
          <div className="border-b border-[#eadfcd] px-5 py-4">
            <h2 className="text-xl font-semibold">Newest adopter accounts</h2>
          </div>
          {newAccounts.length === 0 ? (
            <p className="p-5 text-sm text-[#65584f]/65">No new adopter accounts in this period.</p>
          ) : (
            <div className="divide-y divide-[#eadfcd]">
              {newAccounts.slice(0, 25).map((user) => (
                <article className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1.2fr_0.7fr_0.8fr_auto]" key={user.id}>
                  <div><p className="font-semibold">{profileMap.get(user.id)?.full_name || user.email || "Unnamed account"}</p><p className="mt-1 text-xs text-[#65584f]/60">{user.email ?? "No email"}</p></div>
                  <div><p className="font-semibold">{providerLabel(user)}</p><p className="mt-1 text-xs text-[#65584f]/60">Sign-in method</p></div>
                  <div><p className="font-semibold capitalize">{adopterMap.get(user.id)?.verification_status?.replaceAll("_", " ") ?? "Not started"}</p><p className="mt-1 text-xs text-[#65584f]/60">Verification</p></div>
                  <time className="text-xs text-[#65584f]/60">{formatDateTime(user.created_at)}</time>
                </article>
              ))}
            </div>
          )}
        </section>
    </PawjaiWorkspaceShell>
  );
}
