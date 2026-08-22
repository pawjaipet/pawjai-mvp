export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleMomentNotification = {
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  isDismissedMoment?: () => boolean;
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
};

export type GoogleAccounts = {
  id: {
    cancel: () => void;
    initialize: (config: {
      callback: (response: GoogleCredentialResponse) => void;
      client_id: string;
      nonce?: string;
      use_fedcm_for_prompt?: boolean;
    }) => void;
    prompt: (momentListener?: (notification: GoogleMomentNotification) => void) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        logo_alignment?: "left" | "center";
        shape?: "pill" | "rectangular" | "circle" | "square";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        theme?: "outline" | "filled_blue" | "filled_black";
        type?: "standard" | "icon";
        width?: string | number;
      },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}
