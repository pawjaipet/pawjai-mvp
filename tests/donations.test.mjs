import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadDonationsModel() {
  const source = readFileSync(new URL("../utils/donations.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  new Script(outputText).runInNewContext({
    exports: module.exports,
    module,
  });
  return module.exports;
}

test("normalizes blank donation payment fields as an empty optional group", () => {
  const { parseShelterDonationDetails } = loadDonationsModel();

  assert.equal(
    JSON.stringify(
      parseShelterDonationDetails({
        bankAccountName: "",
        bankAccountNumber: "   ",
        bankName: "",
        promptpayId: "",
      }),
    ),
    JSON.stringify({
      bank_account_name: null,
      bank_account_number: null,
      bank_name: null,
      promptpay_id: null,
    }),
  );
});

test("validates promptpay id length and numeric-only format", () => {
  const { parseShelterDonationDetails } = loadDonationsModel();

  assert.equal(
    parseShelterDonationDetails({
      promptpayId: "0812345678",
    }).promptpay_id,
    "0812345678",
  );
  assert.equal(
    parseShelterDonationDetails({
      promptpayId: "1234567890123",
    }).promptpay_id,
    "1234567890123",
  );
  assert.throws(
    () => parseShelterDonationDetails({ promptpayId: "081-234-5678" }),
    /10 or 13 numeric digits/i,
  );
});

test("requires the full bank transfer group when any bank field is filled", () => {
  const { parseShelterDonationDetails } = loadDonationsModel();

  assert.equal(
    JSON.stringify(
      parseShelterDonationDetails({
        bankAccountName: "Happy Paws Foundation",
        bankAccountNumber: "0012345678",
        bankName: "Kasikornbank",
      }),
    ),
    JSON.stringify({
      bank_account_name: "Happy Paws Foundation",
      bank_account_number: "0012345678",
      bank_name: "Kasikornbank",
      promptpay_id: null,
    }),
  );
  assert.throws(
    () =>
      parseShelterDonationDetails({
        bankAccountNumber: "0012345678",
      }),
    /Bank name is required/i,
  );
  assert.throws(
    () =>
      parseShelterDonationDetails({
        bankAccountName: "Happy Paws Foundation",
        bankAccountNumber: "00123abc",
        bankName: "Kasikornbank",
      }),
    /10-15 numeric digits/i,
  );
});

test("prefers free-text bank name when Other is selected", () => {
  const { parseShelterDonationDetails } = loadDonationsModel();

  assert.equal(
    parseShelterDonationDetails({
      bankAccountName: "Happy Paws Foundation",
      bankAccountNumber: "0012345678",
      bankName: "Other",
      otherBankName: "Community Bank",
    }).bank_name,
    "Community Bank",
  );
  assert.throws(
    () =>
      parseShelterDonationDetails({
        bankAccountName: "Happy Paws Foundation",
        bankAccountNumber: "0012345678",
        bankName: "Other",
      }),
    /Bank name is required/i,
  );
});

test("parses donation intent inputs for authenticated server actions", () => {
  const { parseDonationIntentInput } = loadDonationsModel();

  assert.equal(
    JSON.stringify(
      parseDonationIntentInput({
        amountThb: 150,
        dogId: "dog-1",
        shelterId: "shelter-1",
        treatCount: 3,
      }),
    ),
    JSON.stringify({
      amount_thb: 150,
      dog_id: "dog-1",
      shelter_id: "shelter-1",
      treat_count: 3,
    }),
  );
  assert.throws(
    () =>
      parseDonationIntentInput({
        amountThb: 0,
        dogId: "dog-1",
        shelterId: "shelter-1",
        treatCount: 3,
      }),
    /Amount must be a positive whole number/i,
  );
});
