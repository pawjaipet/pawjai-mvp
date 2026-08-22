import { PawjaiProfileAdminPageContent } from "@/components/admin/PawjaiProfileAdminPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftPawjaiProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return (
    <PawjaiProfileAdminPageContent
      basePath="/admindraft"
      searchParams={searchParams}
      showLock={false}
    />
  );
}
