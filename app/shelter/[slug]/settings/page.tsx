import Link from "next/link";
import { redirect } from "next/navigation";
import { updateShelterPortalAccountAction } from "@/app/shelter/actions";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { getAdminAuthContext } from "@/utils/admin-auth";
import {
  getShelterByPortalSlug,
  getShelterPortalAccount,
  getShelterPortalTarget,
} from "@/utils/shelter-portal";

export const dynamic = "force-dynamic";

function accountMessage(code?: string) {
  switch (code) {
    case "saved":
      return { tone: "success", text: "Account settings saved." };
    case "invalid-username":
      return { tone: "error", text: "Use 3-40 lowercase letters, numbers, underscores, or dashes." };
    case "invalid-email":
      return { tone: "error", text: "Enter a valid email address." };
    case "weak-password":
      return { tone: "error", text: "Use a password with at least 6 characters." };
    case "password-mismatch":
      return { tone: "error", text: "The new passwords do not match." };
    case "current-password-required":
      return { tone: "error", text: "Enter the current password before choosing a new one." };
    case "current-password-invalid":
      return { tone: "error", text: "The current password is incorrect." };
    case "username-taken":
      return { tone: "error", text: "That username is already taken." };
    case "auth-error":
    case "account-error":
      return { tone: "error", text: "The account could not be updated. Please try again." };
    default:
      return null;
  }
}

export default async function ShelterAccountSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ account?: string }>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context || !context.userId || context.isGlobalAdmin) {
    redirect("/shelter");
  }

  const shelter = await getShelterByPortalSlug(slug, context.shelterIds);
  if (!shelter) {
    const fallbackTarget = await getShelterPortalTarget(context);
    redirect(fallbackTarget ?? "/shelter");
  }

  const account = await getShelterPortalAccount(context.userId);
  const message = accountMessage(resolvedSearchParams?.account);
  const returnTo = `/shelter/${slug}/settings`;

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#65584f]">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
            PawJai Shelter Portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Account settings</h1>
          <p className="mt-2 text-sm leading-6 text-[#74685d]">
            Manage the shared login for {shelter.name}. These changes update the real shelter portal account.
          </p>
          <Link
            className="mt-5 inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec]"
            href={`/shelter/${slug}`}
          >
            Back to shelter workspace
          </Link>
        </header>

        <section className="mt-6 rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          {message ? (
            <p className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              message.tone === "success"
                ? "border-[#cfe8c1] bg-[#eff9e9] text-[#3f6f24]"
                : "border-[#f0c9c1] bg-[#fff1ef] text-[#9a3f2f]"
            }`}>
              {message.text}
            </p>
          ) : null}

          <form action={updateShelterPortalAccountAction} className="grid gap-5">
            <input name="returnTo" type="hidden" value={returnTo} />
            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                Username
              </span>
              <input
                autoComplete="username"
                className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#cd8188]"
                defaultValue={account.username}
                name="username"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                Email
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#cd8188]"
                defaultValue={account.email}
                name="email"
                required
                type="email"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                Current password
              </span>
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#eadfce] bg-[#eef4ff] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#cd8188]"
                name="currentPassword"
                placeholder="Required when changing your password"
                type="password"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                New password
              </span>
              <input
                autoComplete="new-password"
                className="w-full rounded-2xl border border-[#eadfce] bg-[#eef4ff] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#cd8188]"
                minLength={6}
                name="newPassword"
                placeholder="Leave blank to keep the current password"
                type="password"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
                Confirm new password
              </span>
              <input
                autoComplete="new-password"
                className="w-full rounded-2xl border border-[#eadfce] bg-[#eef4ff] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#cd8188]"
                minLength={6}
                name="confirmNewPassword"
                placeholder="Enter the new password again"
                type="password"
              />
            </label>

            <button
              className="inline-flex items-center justify-center rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(205,129,136,0.22)] transition hover:bg-[#b87179]"
              type="submit"
            >
              Save account settings
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
