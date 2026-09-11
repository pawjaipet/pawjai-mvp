import TrustPage, { trustMetadata } from "@/components/trust/TrustPage";

const title = "Terms of Use";
const description = "Practical responsibilities for using PawJai to discover dogs and connect with shelter partners.";

export const metadata = trustMetadata(title, description, "/terms");

export default function Page() {
  return (
    <TrustPage title={title} description={description} path="/terms" sections={[
      {
            "title": "About these terms",
            "body": "PawJai is a Thai dog adoption and shelter-matching platform. These are operational website policies, not legal advice. Read them alongside our Privacy Policy and adoption safety guidance. They do not replace an adoption agreement with a shelter or rights that apply under law."
      },
      {
            "title": "PawJai’s role",
            "body": "PawJai helps people browse dog listings, explore matching suggestions, and request visits with shelter partners. A listing, match, saved dog, or appointment request is not an adoption approval or a guarantee that a dog is available. Confirm details and appointment arrangements with the shelter."
      },
      {
            "title": "Your account and information",
            "body": "Provide accurate information, use an account you are authorised to use, and keep sign-in details secure. Do not impersonate others or submit documents, photos, or messages you do not have permission to share. If you are not able to enter an adoption agreement yourself, involve a parent, guardian, or responsible adult and confirm the shelter’s requirements."
      },
      {
            "title": "Responsible use",
            "body": "Use PawJai respectfully and for legitimate adoption, shelter, and support purposes. Do not harass people, publish private information, submit misleading listings, promote animal abuse or illegal animal trading, send spam, or attempt to bypass access controls. Content or access may be restricted to address misuse or safety concerns; contact support if you believe there has been a mistake."
      },
      {
            "title": "Shelter decisions and animal care",
            "body": "Shelter partners set their adoption requirements and make placement decisions. Ask about health, behaviour, vaccination, sterilisation, care needs, fees, and follow-up before agreeing to adopt. Information can change and may be incomplete. PawJai does not guarantee a dog’s health, temperament, suitability, or an adoption outcome. Consult a qualified veterinarian for medical advice."
      },
      {
            "title": "Donations, fees, and external services",
            "body": "Review the recipient, amount, and any applicable payment terms before paying. A donation does not reserve a dog or secure adoption approval. Do not assume a payment is tax-deductible. For payment mistakes or refund questions, contact the named recipient and PawJai support with a brief description. Separate subscription or payment-provider terms may apply where those services are offered."
      },
      {
            "title": "Content and service availability",
            "body": "Only submit content you have the right to share. PawJai uses submitted information and content to provide the relevant platform features, including displaying intended public listings. Availability and features may change, and interruptions can occur. Contact the shelter directly for time-sensitive arrangements."
      },
      {
            "title": "Questions and updates",
            "body": "Contact PawJai about account issues, inaccurate listings, or concerns about these terms. The date above identifies the latest wording. Shelter-specific agreements and applicable legal rights continue to apply."
      }
]} />
  );
}
