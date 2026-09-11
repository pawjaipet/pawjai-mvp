import TrustPage, { trustMetadata } from "@/components/trust/TrustPage";

const title = "Adoption Safety";
const description = "A little preparation helps protect adopters, shelter partners, and the dogs in their care.";

export const metadata = trustMetadata(title, description, "/safety");

export default function Page() {
  return (
    <TrustPage title={title} description={description} path="/safety" sections={[
      {
            "title": "Meet the shelter and the dog",
            "body": "PawJai connects adopters with shelter partners. Confirm who you are meeting, the location, and the appointment before travelling. Meet the dog with shelter staff in an agreed setting and allow time to understand its needs. A profile or match is a starting point, not an adoption guarantee."
      },
      {
            "title": "Ask before adopting",
            "body": "Discuss health history, vaccinations, sterilisation, behaviour, daily routines, and any ongoing care costs. Check that your household, housing arrangements, time, and budget can support the dog. Agree on paperwork, any fees, and shelter follow-up before taking the dog home."
      },
      {
            "title": "Check payments and protect your information",
            "body": "Verify the recipient with the shelter before sending money, especially if payment details change unexpectedly. Do not share passwords or one-time sign-in codes. Use the designated document-upload flow for requested verification rather than posting documents publicly. A donation never guarantees adoption approval."
      },
      {
            "title": "Plan for life after adoption",
            "body": "Prepare a safe home and discuss introductions, transport, and settling in with shelter staff. Keep vaccination and care records in My Adopted Pets after adoption, and arrange veterinary care when needed. If an adoption becomes difficult, contact the shelter early to discuss support and next steps."
      },
      {
            "title": "Report a concern",
            "body": "Contact PawJai about a suspicious listing, payment request, harassment, or a privacy concern. Include the relevant page link and a short explanation without sensitive documents. For immediate danger, contact local emergency services; for urgent animal health concerns, contact a veterinarian. PawJai support is not an emergency service."
      }
]} />
  );
}
