import Link from "next/link";
import type { ReactNode } from "react";
import AdminGateForm from "@/app/admin/dogs/new/AdminGateForm";
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav";
import { getAdminAuthContext, requireGlobalAdmin } from "@/utils/admin-auth";
import {
  DEFAULT_PAWJAI_PROFILE_CONTENT,
  loadPawjaiProfileContent,
  type PawjaiContactItem,
  type PawjaiPartnerShelter,
} from "@/utils/pawjai-profile";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  lockAdminGateAction,
  savePawjaiProfileAction,
  unlockAdminGateAction,
} from "@/app/admin/pawjaiprofile/actions";
import { initialPawjaiAdminGateState } from "@/app/admin/pawjaiprofile/form-state";

function inputClass() {
  return "w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50";
}

function textareaClass() {
  return `${inputClass()} min-h-[110px] resize-y`;
}

function sectionCard(title: string, description: string, children: ReactNode) {
  return (
    <section className="rounded-[28px] border border-[#eadfce] bg-white/90 p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#4f4338]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#7a6d61]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function withEmptyShelterRows(items: PawjaiPartnerShelter[], totalRows = 10) {
  const rows = [...items];

  while (rows.length < totalRows) {
    rows.push({ detail: "", logo_url: null, name: "" });
  }

  return rows;
}

function withEmptyContactRows(items: PawjaiContactItem[], totalRows = 5) {
  const rows = [...items];

  while (rows.length < totalRows) {
    rows.push({ href: null, label: "", type: "custom" });
  }

  return rows;
}

export async function PawjaiProfileAdminPageContent({
  basePath = "/admin",
  lockedFallback,
  routePath,
  searchParams,
  showLock = true,
}: {
  basePath?: "/admin" | "/admindraft";
  lockedFallback?: ReactNode;
  routePath?: "/admin/pawjaiprofile" | "/admindraft/aboutcontent" | "/admindraft/pawjaiprofile";
  searchParams?: Promise<{ message?: string }>;
  showLock?: boolean;
}) {
  const currentRoutePath = routePath ?? `${basePath}/pawjaiprofile`;
  const adminContext = await getAdminAuthContext();
  const resolvedSearchParams = await searchParams;

  if (!adminContext) {
    return lockedFallback ?? (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AdminGateForm action={unlockAdminGateAction} initialState={initialPawjaiAdminGateState} />
      </div>
    );
  }

  await requireGlobalAdmin(currentRoutePath);

  const supabase = createAdminClient();
  const content = await loadPawjaiProfileContent(supabase);
  const shelterRows = withEmptyShelterRows(
    content.partnerShelters,
    Math.max(10, content.partnerShelters.length + 2),
  );
  const contactRows = withEmptyContactRows(content.contactItems, Math.max(5, content.contactItems.length + 1));
  const message = resolvedSearchParams?.message?.trim() ?? "";
  const usedFallback = content === DEFAULT_PAWJAI_PROFILE_CONTENT;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
            PawJai Admin
          </p>
          <p className="mt-2 text-sm text-[#7a6d61]">
            Edit the public PawJai story shown on the About page.
          </p>
        </div>
        <AdminWorkspaceNav active="about" basePath={basePath}>
          {showLock ? (
            <form action={lockAdminGateAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-medium text-[#5b4d40] transition hover:bg-[#faf4ec]"
              >
                Lock admin page
              </button>
            </form>
          ) : null}
        </AdminWorkspaceNav>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-[#d7e7c7] bg-[#f4fbec] px-4 py-3 text-sm text-[#46602e]">
          {message}
        </div>
      ) : null}

      {usedFallback ? (
        <div className="mb-6 rounded-2xl border border-[#f1d8b5] bg-[#fff7ec] px-4 py-3 text-sm text-[#8a5a1f]">
          Showing built-in fallback content. Apply the new Supabase migration before expecting saves to persist.
        </div>
      ) : null}

      <form action={savePawjaiProfileAction} className="space-y-6">
        <input name="returnTo" type="hidden" value={currentRoutePath} />
        {sectionCard(
          "Hero Copy",
          "This controls the short line under the PawJai logo at the top of the About page.",
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Slogan</span>
              <input
                name="hero_slogan"
                defaultValue={content.heroSlogan}
                className={inputClass()}
                placeholder="Connecting Thai dogs with loving homes"
              />
            </label>
          </div>,
        )}

        {sectionCard(
          "Mission",
          "Use this for the main PawJai story and purpose statement.",
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Mission heading</span>
              <input name="mission_title" defaultValue={content.missionTitle} className={inputClass()} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Mission copy</span>
              <textarea
                name="mission_body"
                defaultValue={content.missionBody}
                className={textareaClass()}
                placeholder="Tell visitors what PawJai exists to change."
              />
            </label>
          </div>,
        )}

        {sectionCard(
          "Partner Shelters",
          "Each row appears in the public shelter list. Add a logo URL if you want the real shelter badge instead of the default icon.",
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#efe2d4] bg-[#fffdfa] px-4 py-3 text-sm text-[#6f6256]">
              You have extra blank rows ready for new shelters, and empty rows are ignored on save.
            </div>
            {shelterRows.map((item, index) => (
              <div key={`shelter-row-${index}`} className="grid gap-3 rounded-2xl border border-[#efe2d4] bg-[#fffdfa] p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Shelter name</span>
                  <input
                    name={`shelter_name_${index}`}
                    defaultValue={item.name}
                    className={inputClass()}
                    placeholder="Soi Dog Foundation"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Detail line</span>
                  <input
                    name={`shelter_detail_${index}`}
                    defaultValue={item.detail}
                    className={inputClass()}
                    placeholder="Phuket · 1,600+ dogs"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Logo URL</span>
                  <input
                    name={`shelter_logo_url_${index}`}
                    defaultValue={item.logo_url ?? ""}
                    className={inputClass()}
                    placeholder="https://.../shelter-logo.png"
                  />
                </label>
              </div>
            ))}
          </div>,
        )}

        {sectionCard(
          "Contact Us",
          "Use the type to drive the icon. `Href` is optional if the label itself is enough for email, phone, or website.",
          <div className="space-y-4">
            {contactRows.map((item, index) => (
              <div key={`contact-row-${index}`} className="grid gap-3 rounded-2xl border border-[#efe2d4] bg-[#fffdfa] p-4 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Type</span>
                  <select name={`contact_type_${index}`} defaultValue={item.type} className={inputClass()}>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="social">Social</option>
                    <option value="website">Website</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Label</span>
                  <input
                    name={`contact_label_${index}`}
                    defaultValue={item.label}
                    className={inputClass()}
                    placeholder="@pawjai.official"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Href</span>
                  <input
                    name={`contact_href_${index}`}
                    defaultValue={item.href ?? ""}
                    className={inputClass()}
                    placeholder="https://instagram.com/pawjai.official"
                  />
                </label>
              </div>
            ))}
          </div>,
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#bf781f]"
          >
            Save PawJai profile
          </button>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec]"
          >
            Preview public page
          </Link>
        </div>
      </form>
    </div>
  );
}
