"use client";

import { useEffect, useMemo, useState } from "react";
import generatePromptPayPayload from "promptpay-qr";
import QRCode from "qrcode";

type DonationDetailsFieldsProps = {
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  promptpayId: string | null;
};

const THAI_BANKS = [
  "Bangkok Bank",
  "Kasikornbank",
  "Krungthai Bank",
  "Siam Commercial Bank",
  "Krungsri / Bank of Ayudhya",
  "TTB",
  "Government Savings Bank",
  "CIMB Thai",
  "UOB Thailand",
  "Kiatnakin Phatra",
  "GHB",
  "Tisco",
  "Standard Chartered",
  "Other",
];

const PROMPTPAY_PATTERN = /^(\d{10}|\d{13})$/;

function isListedBank(value: string | null) {
  return value ? THAI_BANKS.includes(value) && value !== "Other" : false;
}

export default function DonationDetailsFields({
  bankAccountName,
  bankAccountNumber,
  bankName,
  promptpayId,
}: DonationDetailsFieldsProps) {
  const [currentPromptPayId, setCurrentPromptPayId] = useState(promptpayId ?? "");
  const [currentBankName, setCurrentBankName] = useState(isListedBank(bankName) ? bankName ?? "" : bankName ? "Other" : "");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const otherBankDefault = useMemo(() => (bankName && !isListedBank(bankName) ? bankName : ""), [bankName]);
  const promptpayIsValid = PROMPTPAY_PATTERN.test(currentPromptPayId);

  useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      if (!promptpayIsValid) {
        setQrDataUrl("");
        return;
      }

      const payload = generatePromptPayPayload(currentPromptPayId, {});
      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 160,
      });

      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    }

    renderQr().catch(() => {
      if (!cancelled) {
        setQrDataUrl("");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentPromptPayId, promptpayIsValid]);

  return (
    <div className="mt-4 border-t border-[#eadfce] pt-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#4f4338]">Donation details</h3>
        <p className="mt-1 text-sm leading-6 text-[#74685d]">
          Donors will see this information when they sponsor a dog at this shelter. Funds go directly to the shelter - PAWJAI does not process payments.
        </p>
      </div>

      <div className="grid gap-4">
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">PromptPay ID</span>
          <input
            className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 font-mono text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
            defaultValue={promptpayId ?? ""}
            inputMode="numeric"
            name="promptpayId"
            onChange={(event) => setCurrentPromptPayId(event.target.value.trim())}
            pattern="(\d{10}|\d{13})?"
          />
          <span className="mt-2 block text-xs text-[#8c7d70]">10-digit phone number or 13-digit organization tax ID</span>
        </label>

        <div className="flex justify-center rounded-2xl border border-[#eadfce] bg-[#fff8ed] p-4">
          {qrDataUrl ? (
            <img alt="PromptPay QR preview" className="h-40 w-40" src={qrDataUrl} />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-[#d8c7ad] bg-white/70 px-4 text-center text-xs font-semibold leading-5 text-[#8d7f72]">
              Enter a PromptPay ID to preview the QR
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Bank name</span>
            <select
              className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
              defaultValue={currentBankName}
              name="bankName"
              onChange={(event) => setCurrentBankName(event.target.value)}
            >
              <option value="">Select bank</option>
              {THAI_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>

          {currentBankName === "Other" ? (
            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Other bank name</span>
              <input
                className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
                defaultValue={otherBankDefault}
                name="otherBankName"
              />
            </label>
          ) : null}

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Account number</span>
            <input
              className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
              defaultValue={bankAccountNumber ?? ""}
              inputMode="numeric"
              name="bankAccountNumber"
              pattern="\d{10,15}"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Account name</span>
            <input
              className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]"
              defaultValue={bankAccountName ?? ""}
              name="bankAccountName"
            />
            <span className="mt-2 block text-xs text-[#8c7d70]">Must match the official bank account holder name</span>
          </label>
        </div>
      </div>
    </div>
  );
}
