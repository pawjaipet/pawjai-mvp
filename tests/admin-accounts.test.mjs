import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accountsSource = readFileSync(
  new URL("../components/admin/AdminAccountsPageContent.tsx", import.meta.url),
  "utf8",
);
const shelterActionsSource = readFileSync(
  new URL("../app/admin/accounts/shelter-actions.ts", import.meta.url),
  "utf8",
);

test("admin accounts separates public users from shelter portal access", () => {
  assert.equal(accountsSource.includes("User accounts"), true);
  assert.equal(accountsSource.includes("Shelter accounts"), true);
  assert.equal(accountsSource.includes('parseTab(params.tab)'), true);
  assert.equal(accountsSource.includes('role !== "admin" && role !== "shelter_admin"'), true);
  assert.equal(accountsSource.includes('.from("product_analytics_events")'), true);
  assert.equal(accountsSource.includes('.from("appointments")'), true);
  assert.equal(accountsSource.includes('href={`${basePath}/analytics`}'), true);
});

test("user accounts expose verification, dog activity, wishlists, and effective subscription access", () => {
  assert.equal(accountsSource.includes('.from("wishlists")'), true);
  assert.equal(accountsSource.includes('.from("subscription_launch_grants")'), true);
  assert.equal(accountsSource.includes('.from("billing_subscriptions")'), true);
  assert.equal(accountsSource.includes("Founding Premium"), true);
  assert.equal(accountsSource.includes("Founding member #${grantNumber} of 200"), true);
  assert.equal(accountsSource.includes("Viewed dog profiles"), true);
  assert.equal(accountsSource.includes("Wishlist dogs"), true);
  assert.equal(accountsSource.includes("profile opens"), true);
  assert.equal(accountsSource.includes("Email confirmed"), true);
  assert.equal(accountsSource.includes("Adopter verification"), true);
});

test("shelter account tab is portal-only and never exposes stored passwords", () => {
  assert.equal(accountsSource.includes("authorized only for their linked shelter portal"), true);
  assert.equal(accountsSource.includes("They are not PawJai admin accounts"), true);
  assert.equal(accountsSource.includes("Password is protected and cannot be displayed."), true);
  assert.equal(accountsSource.includes("Reset password"), true);
  assert.equal(accountsSource.includes("PawJai admin</option>"), false);
});

test("shelter portal account mutations require a global admin and preserve role boundaries", () => {
  assert.equal(shelterActionsSource.includes("requireGlobalAdmin"), true);
  assert.equal(shelterActionsSource.includes('role: "shelter_admin"'), true);
  assert.equal(shelterActionsSource.includes('.from("shelter_portal_accounts")'), true);
  assert.equal(shelterActionsSource.includes("updateUserById"), true);
  assert.equal(shelterActionsSource.includes("passwordReset: true"), true);
  assert.equal(shelterActionsSource.includes('role: "admin"'), false);
});
