// Logged-out visitors can browse every available dog. When they reach this
// dog in the feed, we invite them to create a free account; "Maybe later"
// closes the invite and they keep scrolling. An account is still needed to
// save dogs and book a shelter visit.
export const GUEST_SIGNUP_PROMPT_AT_DOG = 9;

// Kept for the browser tab's session, so the invite shows once per visit and
// not again each time the visitor returns to the feed from a dog profile.
export const GUEST_SIGNUP_PROMPT_SESSION_KEY = "pawjai.guest-signup-prompt-shown";

export function shouldShowGuestSignupPrompt({
  alreadyShown,
  dogsSeen,
  isLoggedIn,
}: {
  alreadyShown: boolean;
  dogsSeen: number;
  isLoggedIn: boolean;
}) {
  return !isLoggedIn && !alreadyShown && dogsSeen >= GUEST_SIGNUP_PROMPT_AT_DOG;
}
