import { redirect } from "next/navigation";
import AdminGateForm from "@/app/admin/dogs/new/AdminGateForm";
import { unlockAdminGateAction } from "@/app/admin/dogs/new/actions";
import { initialAdminGateState } from "@/app/admin/dogs/new/form-state";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { sanitizeNextPath } from "@/utils/account-model";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const context = await getAdminAuthContext();
  const { message, next } = await searchParams;
  const nextPath = sanitizeNextPath(next || "/admin");

  if (context) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] md:items-center">
        <section className="text-[#4f4338]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
            Secure workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            One admin home for PawJai and partner shelters.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#74685d]">
            PawJai admins can manage the full platform. Shelter accounts can review bookings,
            messages, schedules, and listings for their linked shelter.
          </p>
          {message ? (
            <div className="mt-6 rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#6f5d4c]">
              {message}
            </div>
          ) : null}
        </section>

        <AdminGateForm
          action={unlockAdminGateAction}
          initialState={initialAdminGateState}
        />
      </div>
    </main>
  );
}
