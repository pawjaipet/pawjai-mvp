import AdminAdsPage from "@/app/admin/ads/AdminAdsPage";
import { isAdminGateOpen } from "@/utils/admin-auth";
import AdsGateForm, { initialAdsGateState } from "./AdsGateForm";
import { unlockAdsGateAction } from "./actions";

export default async function AdsOnboardingPage() {
  const gateOpen = await isAdminGateOpen();

  if (!gateOpen) {
    return (
      <AdsGateForm
        action={unlockAdsGateAction}
        initialState={initialAdsGateState}
      />
    );
  }

  return <AdminAdsPage />;
}
