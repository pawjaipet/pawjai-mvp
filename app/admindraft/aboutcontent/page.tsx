import { PawjaiProfileAdminPageContent } from "@/components/admin/PawjaiProfileAdminPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAboutContentPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return (
    <PawjaiProfileAdminPageContent
      basePath="/admindraft"
      routePath="/admindraft/aboutcontent"
      searchParams={searchParams}
      showLock={false}
    />
  );
}
