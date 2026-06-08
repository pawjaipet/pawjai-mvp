type ShelterDonationInput = {
  bankAccountName?: unknown;
  bankAccountNumber?: unknown;
  bankName?: unknown;
  otherBankName?: unknown;
  promptpayId?: unknown;
};

export type ShelterDonationDetailsPayload = {
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  promptpay_id: string | null;
};

export type DonationIntentInput = {
  amountThb: unknown;
  dogId: unknown;
  shelterId: unknown;
  treatCount: unknown;
};

export type DonationIntentPayload = {
  amount_thb: number;
  dog_id: string;
  shelter_id: string;
  treat_count: number;
};

function cleanOptional(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function parsePositiveInteger(value: unknown, message: string) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(message);
  }

  return numberValue;
}

export function parseShelterDonationDetails(input: ShelterDonationInput): ShelterDonationDetailsPayload {
  const promptpayId = cleanOptional(input.promptpayId);
  const selectedBankName = cleanOptional(input.bankName);
  const otherBankName = cleanOptional(input.otherBankName);
  const bankName = selectedBankName === "Other" ? otherBankName : selectedBankName;
  const bankAccountNumber = cleanOptional(input.bankAccountNumber);
  const bankAccountName = cleanOptional(input.bankAccountName);
  const anyBankFieldFilled = Boolean(selectedBankName || otherBankName || bankAccountNumber || bankAccountName);

  if (promptpayId && !/^(\d{10}|\d{13})$/.test(promptpayId)) {
    throw new Error("PromptPay ID must be 10 or 13 numeric digits.");
  }

  if (anyBankFieldFilled) {
    if (!bankName) {
      throw new Error("Bank name is required when bank transfer details are filled.");
    }

    if (!bankAccountNumber) {
      throw new Error("Account number is required when bank transfer details are filled.");
    }

    if (!bankAccountName) {
      throw new Error("Account name is required when bank transfer details are filled.");
    }

    if (!/^\d{10,15}$/.test(bankAccountNumber)) {
      throw new Error("Account number must be 10-15 numeric digits.");
    }
  }

  return {
    bank_account_name: bankAccountName,
    bank_account_number: bankAccountNumber,
    bank_name: bankName,
    promptpay_id: promptpayId,
  };
}

export function parseDonationIntentInput(input: DonationIntentInput): DonationIntentPayload {
  const dogId = cleanOptional(input.dogId);
  const shelterId = cleanOptional(input.shelterId);

  if (!dogId) {
    throw new Error("Dog ID is required.");
  }

  if (!shelterId) {
    throw new Error("Shelter ID is required.");
  }

  return {
    amount_thb: parsePositiveInteger(input.amountThb, "Amount must be a positive whole number."),
    dog_id: dogId,
    shelter_id: shelterId,
    treat_count: parsePositiveInteger(input.treatCount, "Treat count must be a positive whole number."),
  };
}
