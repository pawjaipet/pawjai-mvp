import { PawjaiProfileAdminPageContent } from "@/components/admin/PawjaiProfileAdminPageContent";

export const dynamic = "force-dynamic";

export default async function AdminAboutContentPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return (
    <PawjaiProfileAdminPageContent
      basePath="/admin"
      routePath="/admin/aboutcontent"
      searchParams={searchParams}
      showLock={false}
    />
  );
}
