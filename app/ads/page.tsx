import AdminAdsPage from "@/app/admin/ads/AdminAdsPage";
import { getAdminAuthContext, requireGlobalAdmin } from "@/utils/admin-auth";
import AdsGateForm, { initialAdsGateState } from "./AdsGateForm";
import { unlockAdsGateAction } from "./actions";

export default async function AdsOnboardingPage() {
  const adminContext = await getAdminAuthContext();

  if (!adminContext) {
    return (
      <AdsGateForm
        action={unlockAdsGateAction}
        initialState={initialAdsGateState}
      />
    );
  }

  await requireGlobalAdmin("/ads");

  return <AdminAdsPage />;
}
