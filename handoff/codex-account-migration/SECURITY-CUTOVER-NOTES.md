# Security Cutover Notes

## Credential-like content in archived history

The local Codex history index exposed a credential-like value in the archived summary for `RESEND automation email`. It is intentionally not copied into this repository pack. Treat the old value as compromised if it was ever real:

- [ ] Rotate/revoke the Resend API key before or during company-account cutover.
- [ ] Check the Resend dashboard for the key's status and recent usage.
- [ ] Confirm the active production key exists only in the authorized secret store/environment.
- [ ] Search repository history and local exports for accidental secret exposure, without pasting matches into chat.
- [ ] Review Cloudflare, Backblaze, Supabase, Vercel, GitHub, and OAuth credentials under company ownership.

This is a security precaution based on the archived task metadata; the secret value is not preserved here and should not be inferred from this document.
