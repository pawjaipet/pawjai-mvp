import AdminAdsPage from "./AdminAdsPage";
import { requireGlobalAdmin } from "@/utils/admin-auth";

export default async function AdminAdsRoute() {
  await requireGlobalAdmin("/admin/ads");

  return <AdminAdsPage />;
}
