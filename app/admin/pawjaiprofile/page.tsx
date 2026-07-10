import { PawjaiProfileAdminPageContent } from "@/components/admin/PawjaiProfileAdminPageContent";

export default function PawjaiProfileAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return <PawjaiProfileAdminPageContent basePath="/admin" searchParams={searchParams} />;
}
