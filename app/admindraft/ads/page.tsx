import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminDraftAdsPage() {
  redirect("/admindraft?view=ads");
}
