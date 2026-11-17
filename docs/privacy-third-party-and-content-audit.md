# Privacy and Trust Audit

Updated: 2026-10-20

## Implemented

- Public Privacy Policy, Terms of Use, Cookie Policy, Refund Policy, and Data Deletion Request pages are linked from the trust footer.
- Optional Google Analytics is consent-gated. Essential Supabase session cookies remain enabled because protected features require them.
- Account creation now requires agreement to the Terms and Privacy Policy plus an age/guardian attestation. The attestation is stored in Supabase Auth user metadata; legal review should confirm whether a separate consent ledger is required.
- The app does not currently send marketing email. Resend messages found in the codebase are transactional booking, shelter, or ad-workflow notifications. Do not add a marketing list without an unsubscribe and preference center.

## Third-party inventory

| Service | Purpose | Data boundary / action |
| --- | --- | --- |
| Supabase | Auth, database, storage | Account, adoption workflow, and uploaded records; review RLS and retention in the dashboard. |
| Google Analytics | Optional product measurement | Only after explicit consent; no form contents or documents. |
| Google Identity Services | Optional Google sign-in | Loaded on auth surfaces when configured; Google account sign-in data is used to access the account. |
| Stripe | Subscription/payment processing where enabled | Payment details are handled by the provider; publish the exact checkout/refund terms before charging. |
| Resend | Transactional email | Booking and workflow notices; no marketing unsubscribe channel currently exists. |
| Backblaze B2 / Cloudflare | Media delivery | Public dog/media assets; confirm asset ownership and takedown process. |
| Google/MyMemory translation route | Translation helper | Review whether user-entered text can be sent externally before using it for sensitive content. |

## Requires owner/legal input

- Replace the generic support contact with the registered operator name, legal address, privacy contact/controller details, and any required Thai business details.
- Confirm the actual donation, subscription, and payment/refund model with counsel before publishing stronger promises.
- Confirm licenses and source records for every partner-supplied or stock image. Remove any asset whose license cannot be established.
- Review age handling with Thai counsel. PawJai currently avoids requesting date of birth and asks for an age/guardian attestation instead.
- Check color contrast and keyboard flows on every route with an automated accessibility tool and manual keyboard pass; existing components already include many alt texts and focus states, but this needs a full release audit.
