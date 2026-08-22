import { redirect } from "next/navigation";
import AdminGoogleLogin from "@/components/admin/AdminGoogleLogin";
import {
  getAdminAuthContext,
  sanitizeAdminNextPath,
} from "@/utils/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = sanitizeAdminNextPath(resolvedSearchParams?.next);
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (context?.isGlobalAdmin) {
    redirect(nextPath);
  }

  return (
    <AdminGoogleLogin
      message={resolvedSearchParams?.message}
      nextPath={nextPath}
    />
  );
}
