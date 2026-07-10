import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { AdminAuditPageContent } from "@/components/admin/AdminAuditPageContent";

export const dynamic = "force-dynamic";

export default function AdminDraftAuditPage() {
  return <AdminAuditPageContent basePath="/admindraft" lockedFallback={<AdminDraftGate />} />;
}
