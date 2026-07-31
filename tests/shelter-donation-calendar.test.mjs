import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("shelter workspace exposes donations and URL-backed booking calendar tabs", () => {
  const panel = readFileSync(new URL("../components/admin/AdminReorgDraftPanel.tsx", import.meta.url), "utf8");

  assert.equal(panel.includes('onClick={() => setTab("donations")}'), true);
  assert.equal(panel.includes("href={bookingListHref}"), true);
  assert.equal(panel.includes("href={calendarReturnTo}"), true);
  assert.equal(panel.includes("dateKey >= range.startDate"), true);
  assert.equal(panel.includes("dateKey <= range.endDate"), true);
  assert.equal(panel.includes('name="note" placeholder="Holiday, staff training, fully booked" required'), true);
});

test("blockout mutations validate ranges and report duplicate submissions", () => {
  const actions = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");

  assert.equal(actions.includes("The blockout end date must be on or after the start date."), true);
  assert.equal(actions.includes("Add a reason for this blockout date."), true);
  assert.equal(actions.includes("That blockout date range already exists."), true);
  assert.equal(actions.includes('.select("id")\n    .single()'), true);
});

test("donation slips use private storage and shelter-scoped review", () => {
  const donationActions = readFileSync(new URL("../app/donations/actions.ts", import.meta.url), "utf8");
  const bookingActions = readFileSync(new URL("../app/admin/bookings/actions.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20260731074531_donation_proof_and_personality_dedupe.sql", import.meta.url), "utf8");

  assert.equal(donationActions.includes('const DONATION_SLIPS_BUCKET = "donation-slips"'), true);
  assert.equal(donationActions.includes('.eq("user_id", user.id)'), true);
  assert.equal(bookingActions.includes('.eq("shelter_id", shelterId)'), true);
  assert.equal(migration.includes("'donation-slips',\n  'donation-slips',\n  false"), true);
  assert.equal(migration.includes("donation_intents_shelter_or_admin_select"), true);
});
