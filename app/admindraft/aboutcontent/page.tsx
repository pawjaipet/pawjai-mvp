import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { PawjaiProfileAdminPageContent } from "@/components/admin/PawjaiProfileAdminPageContent";

export const dynamic = "force-dynamic";

export default function AdminDraftAboutContentPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return (
    <PawjaiProfileAdminPageContent
      basePath="/admindraft"
      lockedFallback={<AdminDraftGate />}
      routePath="/admindraft/aboutcontent"
      searchParams={searchParams}
      showLock={false}
    />
  );
}
