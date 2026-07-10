import AdsGateForm, { initialAdsGateState } from "./AdsGateForm";
import { unlockAdsGateAction } from "./actions";
import PartnerAdCreatePage from "./PartnerAdCreatePage";
import { isAdsPartnerGateOpen } from "@/utils/ads-partner-auth";

export default async function AdsOnboardingPage() {
  const gateOpen = await isAdsPartnerGateOpen();

  if (!gateOpen) {
    return (
      <AdsGateForm
        action={unlockAdsGateAction}
        initialState={initialAdsGateState}
      />
    );
  }

  return <PartnerAdCreatePage />;
}
