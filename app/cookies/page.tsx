import TrustPage, { trustMetadata } from "@/components/trust/TrustPage";

const title = "Cookie Policy";
const description = "How PawJai uses essential cookies, browser storage, and optional analytics choices.";
export const metadata = trustMetadata(title, description, "/cookies");

export default function Page() {
  return <TrustPage title={title} description={description} path="/cookies" updatedDate="2026-10-20" sections={[
    { title: "Essential session cookies", body: "PawJai uses essential cookies from Supabase to keep sign-in sessions secure and to support account-protected features. These cannot be switched off through the optional analytics setting because the service cannot provide sign-in and booking features without them." },
    { title: "Preferences and local storage", body: "The app may use browser storage for language, interface preferences, and the choice you make about optional analytics. Clearing browser storage can reset those preferences or sign you out; it does not delete account records." },
    { title: "Optional analytics", body: "Google Analytics is disabled until you choose Allow analytics. If you allow it, Google Analytics cookies may measure page visits and product flows. We do not send names, email addresses, passwords, messages, documents, or form contents to Google Analytics. You can decline or withdraw analytics consent from the banner or Analytics preferences in Settings." },
    { title: "Your choices", body: "You can block or clear cookies in your browser. Blocking essential session cookies may prevent sign-in or protected features from working. Optional analytics is not required to browse dogs, request adoption visits, or use PawJai." },
    { title: "Third-party services", body: "Authentication, hosting, email, payments, media delivery, and optional analytics are provided by specialist services described in our Privacy Policy. Those providers may set or receive technical identifiers under their own policies." },
  ]} />;
}
