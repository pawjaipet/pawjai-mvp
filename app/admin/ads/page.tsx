import { redirect } from "next/navigation";

export default function AdminAdsRedirectPage() {
  redirect("/admin?view=ads");
}
