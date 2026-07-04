import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { loadAdminDraftData } from "@/utils/admin-draft-data";

export const dynamic = "force-dynamic";

export default async function AdminDraftPage() {
  const data = await loadAdminDraftData();

  return <AdminReorgDraftPanel data={data} />;
}
