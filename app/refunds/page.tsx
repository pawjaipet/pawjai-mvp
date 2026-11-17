import TrustPage, { trustMetadata } from "@/components/trust/TrustPage";

const title = "Refund Policy";
const description = "How PawJai handles donations, adoption visits, subscriptions, and payment questions.";
export const metadata = trustMetadata(title, description, "/refunds");

export default function Page() {
  return <TrustPage title={title} description={description} path="/refunds" updatedDate="2026-10-20" sections={[
    { title: "Adoption visits", body: "PawJai does not treat a visit request as a paid adoption reservation. If a shelter charges a separate fee, the shelter should explain that fee and its refund terms before payment." },
    { title: "Donations", body: "Review the recipient and amount before confirming a donation. Donation disputes or mistaken transfers should be raised promptly with the payment provider and the named recipient. PawJai cannot promise a refund for funds already transferred to a shelter or external payment provider." },
    { title: "Subscriptions", body: "Where PawJai offers a paid subscription, the checkout and payment provider terms shown at purchase apply. Contact PawJai promptly about duplicate charges or an accidental purchase; we will review the transaction and any refund rights under applicable law and provider rules." },
    { title: "How to ask for help", body: "Email pawjaipet@gmail.com with the account email, approximate date, amount, and a short description. Do not send passwords, full payment-card details, identity documents, or sign-in codes." },
  ]} />;
}
