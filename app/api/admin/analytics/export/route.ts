import { getAdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { makeAnalyticsWorkbook, type WorkbookCell } from "@/utils/admin-analytics-workbook";

export const runtime = "nodejs";
export const maxDuration = 60;

type EventRow = { event_name: string; created_at: string; visitor_id: string | null; session_id: string | null; user_id: string | null };
type AccountRow = { created_at: string; email_confirmed_at?: string | null; confirmed_at?: string | null; id: string; app_metadata?: { provider?: string } };
type AppointmentRow = { created_at: string; status: string };

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const eventNames = ["page_view", "dog_feed_impression", "dog_profile_view", "dog_shared", "booking_started", "booking_succeeded", "booking_failed"];
const day = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const key = (event: EventRow) => event.user_id ? `u:${event.user_id}` : event.visitor_id ? `v:${event.visitor_id}` : event.session_id ? `s:${event.session_id}` : null;

export async function GET(request: Request) {
  const context = await getAdminAuthContext();
  if (!context?.isGlobalAdmin || context.role !== "admin" || !context.userId) return Response.json({ error: "PawJai HQ access required." }, { status: 403, headers });
  const range = new URL(request.url).searchParams.get("range");
  const selectedRange = range === "30d" || range === "all" ? range : "7d";
  const start = selectedRange === "all" ? null : new Date(Date.now() - (selectedRange === "30d" ? 30 : 7) * 86400000).toISOString();
  const db = createAdminClient();
  try {
    const accountPromise = (async () => {
      const users: AccountRow[] = [];
      for (let page = 1; page <= 100; page++) {
        const result = await db.auth.admin.listUsers({ page, perPage: 1000 });
        if (result.error) throw result.error;
        users.push(...result.data.users);
        if (result.data.users.length < 1000) break;
        if (page === 100) throw new Error("Account export limit reached.");
      }
      return users;
    })();
    const eventPromise = (async () => {
      const events: EventRow[] = [];
      for (let offset = 0; offset < 50000; offset += 1000) {
        let query = db.from("product_analytics_events").select("event_name,created_at,visitor_id,session_id,user_id").order("created_at", { ascending: false }).range(offset, offset + 999);
        if (start) query = query.gte("created_at", start);
        const result = await query;
        if (result.error) throw result.error;
        events.push(...(result.data ?? []));
        if ((result.data?.length ?? 0) < 1000) return events;
      }
      throw new Error("Event export limit reached; choose a shorter range.");
    })();
    const appointmentPromise = (async () => {
      const appointments: AppointmentRow[] = [];
      for (let offset = 0; offset < 50000; offset += 1000) {
        let query = db.from("appointments").select("created_at,status").order("created_at", { ascending: false }).range(offset, offset + 999);
        if (start) query = query.gte("created_at", start);
        const result = await query;
        if (result.error) throw result.error;
        appointments.push(...(result.data ?? []));
        if ((result.data?.length ?? 0) < 1000) return appointments;
      }
      throw new Error("Appointment export limit reached; choose a shorter range.");
    })();
    const [accounts, events, appointments, profilesResult] = await Promise.all([
      accountPromise, eventPromise, appointmentPromise, db.from("profiles").select("id,role"),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    const nonAdopters = new Set((profilesResult.data ?? []).filter(p => p.role === "admin" || p.role === "shelter_admin").map(p => p.id));
    const adopters = accounts.filter(user => !nonAdopters.has(user.id));
    const newAccounts = adopters.filter(user => !start || user.created_at >= start);
    const confirmed = newAccounts.filter(user => Boolean(user.email_confirmed_at ?? user.confirmed_at));
    const emailAccounts = newAccounts.filter(user => user.app_metadata?.provider !== "google");
    const dates = new Set<string>([...events.map(e => day(e.created_at)), ...newAccounts.map(a => day(a.created_at)), ...appointments.map(a => day(a.created_at))]);
    const dailyHeader = ["Date (Bangkok)", "Unique visitors", ...eventNames, "New adopter accounts", "Email accounts created", "New accounts currently confirmed", "Appointments created"];
    const dailyRows: WorkbookCell[][] = [...dates].sort().map(date => {
      const dailyEvents = events.filter(e => day(e.created_at) === date);
      return [date, new Set(dailyEvents.map(key).filter(Boolean)).size, ...eventNames.map(name => dailyEvents.filter(e => e.event_name === name).length), newAccounts.filter(a => day(a.created_at) === date).length, emailAccounts.filter(a => day(a.created_at) === date).length, confirmed.filter(a => day(a.created_at) === date).length, appointments.filter(a => day(a.created_at) === date).length];
    });
    const count = (name: string) => events.filter(event => event.event_name === name).length;
    const summary: WorkbookCell[][] = [
      ["Metric", "Value", "Meaning / source"],
      ["Period", selectedRange === "all" ? "All recorded" : `Last ${selectedRange === "30d" ? 30 : 7} days`, "Rolling UTC window; daily dates shown in Bangkok time"],
      ["Generated at", new Date().toISOString(), "Snapshot time"],
      ["Unique visitors", new Set(events.map(key).filter(Boolean)).size, "First-party event identifiers; may include internal testing"],
      ["Page views", count("page_view"), "First-party website events"],
      ["Dog feed impressions", count("dog_feed_impression"), "First-party website events"],
      ["Dog profile opens", count("dog_profile_view"), "First-party website events"],
      ["Dog shares", count("dog_shared"), "First-party website events"],
      ["New adopter accounts", newAccounts.length, "Supabase Auth; admin/shelter accounts excluded"],
      ["Email accounts created", emailAccounts.length, "Supabase Auth provider"],
      ["New accounts currently confirmed", confirmed.length, "Confirmation status at export time, not confirmations during period"],
      ["Booking starts", count("booking_started"), "First-party website events"],
      ["Booking successes", count("booking_succeeded"), "First-party website events"],
      ["Booking failures", count("booking_failed"), "First-party website events"],
      ["Appointments created", appointments.length, "Supabase appointment records"],
      ["Profile open rate per feed impression", count("dog_feed_impression") ? Math.round(count("dog_profile_view") / count("dog_feed_impression") * 1000) / 10 : "—", "Percent; directional event ratio, not a user-level conversion rate"],
      ["Booking success per start", count("booking_started") ? Math.round(count("booking_succeeded") / count("booking_started") * 1000) / 10 : "—", "Percent; directional event ratio, not a user-level conversion rate"],
    ];
    const gaps: WorkbookCell[][] = [
      ["Area", "Current limitation", "Useful next step"],
      ["Signup and login funnel", "GA4 auth prompts/submissions and verification events are separate from this first-party export.", "Add GA4 Data API access or mirror consented aggregate funnel events into admin reporting."],
      ["Internal testing", "First-party events do not identify internal/focus-group traffic reliably.", "Tag internal tests before comparing marketing cohorts."],
      ["Saved dogs", "Wishlist table is a current snapshot; there is no dated save/unsave event in this export.", "Track save and unsave events to measure adoption interest over time."],
      ["Adoption outcomes", "Booking and appointment events are proxies; completed adoptions need a clearly defined outcome metric.", "Add adoption completion to the admin funnel."],
      ["Visitor counts", "Anonymous IDs can reset across devices or browsers; visitor counts are estimates.", "Compare trends and conversions, not exact people counts."],
      ["Consent", "GA4 and first-party event collection may have different coverage.", "Keep data sources labeled when comparing figures."],
      ["Marketing sources", "Campaign channels and referrers are in GA4 and are not included in this export.", "Connect GA4 Data API before reporting channel performance here."],
      ["Email confirmation", "The workbook groups currently confirmed new accounts by signup date, not verification date.", "Add timestamped verification events for a true step-by-step funnel."],
    ];
    const workbook = makeAnalyticsWorkbook([{ name: "Summary", rows: summary }, { name: "Daily activity", rows: [dailyHeader, ...dailyRows] }, { name: "Tracking gaps", rows: gaps }]);
    return new Response(Buffer.from(workbook), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="pawjai-user-analytics-${selectedRange}.xlsx"` } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Export unavailable." }, { status: 503, headers });
  }
}
