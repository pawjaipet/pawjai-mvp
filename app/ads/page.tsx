import PartnerAdCreatePage from "./PartnerAdCreatePage";
import { fetchAdCreativeSettings } from "@/utils/ad-creative-settings";

export default async function AdsOnboardingPage() {
  const creativeSettings = await fetchAdCreativeSettings();
  return <PartnerAdCreatePage creativeSettings={creativeSettings} />;
}
