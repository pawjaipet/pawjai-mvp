import TrustPage, { trustMetadata } from "@/components/trust/TrustPage";

const title = "Privacy Policy";
const description = "How PawJai uses information to support dog adoption, shelter visits, and your account.";

export const metadata = trustMetadata(title, description, "/privacy");

export default function Page() {
  return (
    <TrustPage title={title} description={description} path="/privacy" sections={[
      {
            "title": "About this policy",
            "body": "PawJai helps connect adopters and shelter partners in Thailand. This page describes our website’s operational privacy practices. It is not legal advice or a certification of legal compliance."
      },
      {
            "title": "Information used by the service",
            "body": "Depending on the features you use, PawJai processes account and contact details, profile and household preferences, saved dogs, adoption visit requests, messages and attachments, verification documents, and donation or subscription records. If you sign in with Google, account information supplied through that sign-in is used to create or access your account."
      },
      {
            "title": "Why we use information",
            "body": "We use information to operate accounts, suggest suitable dog profiles, coordinate shelter visits, review adoption documents, support adoption follow-up, send service messages, and handle support or safety concerns. Matching suggestions help you explore dogs; the shelter decides whether an adoption can proceed."
      },
      {
            "title": "Cookies, storage, and usage information",
            "body": "The website uses cookies for sign-in and browser storage for preferences and session state. Product analytics records page visits and interactions, such as viewed dogs, swipes, and booking steps, with a session identifier and, when signed in, an account identifier. Hosting and security services may also process technical request information. Clearing browser storage can reset preferences or sign you out; it does not delete records already held by PawJai."
      },
      {
            "title": "Who receives information",
            "body": "Relevant shelter staff and authorised PawJai staff use information needed to handle visits, document review, adoption follow-up, and support. Service providers process information for hosting, account access, file storage, email delivery, security, and payment services where used. Providers may process data outside Thailand. Information may also be disclosed when required by law or to address fraud or safety concerns. External shelter and payment services have their own privacy practices."
      },
      {
            "title": "Documents and safe sharing",
            "body": "Use the designated account or document-upload features when documents are requested. Do not post identity documents, passwords, payment details, or private contact information in public content. For a support enquiry, start with a short description rather than sending identity documents by email."
      },
      {
            "title": "Retention and your choices",
            "body": "Records may remain available for account operation, adoption follow-up, support, security, and applicable recordkeeping needs. Retention depends on the record and its purpose; this page does not promise a fixed deletion period. Contact us to request access, correction, a copy, or deletion of your information, or to raise an objection or ask about restricting use or withdrawing consent where applicable. Requests are assessed under applicable law and may require proportionate identity verification. Some records may need to be retained; clearing browser storage alone is not an account-deletion request."
      },
      {
            "title": "Updates and questions",
            "body": "We will update the date on this page when its wording changes. For privacy questions or account-data requests, contact the PawJai team using the email below. You may also raise a concern with Thailand’s Personal Data Protection Committee."
      }
]} />
  );
}
