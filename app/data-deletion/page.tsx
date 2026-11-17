import TrustPage, { trustMetadata } from "@/components/trust/TrustPage";

const title = "Data Deletion Request";
const description = "Request deletion or review of personal information held by PawJai.";
export const metadata = trustMetadata(title, description, "/data-deletion");

export default function Page() {
  return <TrustPage title={title} description={description} path="/data-deletion" updatedDate="2026-10-20" sections={[
    { title: "Make a request", body: "Email pawjaipet@gmail.com from the email address connected to your PawJai account and write “Data deletion request” in the subject. Tell us whether you want the account closed, specific information deleted, or a review of information we hold." },
    { title: "What happens next", body: "We will verify the request proportionately, identify records that can be deleted, and explain anything that must be retained for safety, legal, payment, or adoption follow-up reasons. Do not email identity documents unless PawJai support specifically requests a safe upload route." },
    { title: "Before you request deletion", body: "Deletion can remove saved dogs, visit history, messages, documents, and account access. Download anything you are entitled to keep before asking us to close the account." },
  ]} />;
}
