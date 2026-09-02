import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import test from "node:test";
import ts from "typescript";

function loadNotificationEmail(env) {
  const source = readFileSync(new URL("../utils/notification-email.ts", import.meta.url), "utf8");
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
    process: { env },
  });
  return module.exports;
}

function loadAdEmail({ sentMessages = [], env = {} } = {}) {
  const source = readFileSync(new URL("../utils/ad-email.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  function require(name) {
    if (name === "@/lib/resend") {
      return {
        getResendClient() {
          return {
            emails: {
              async send(message) {
                sentMessages.push(message);
                return { data: { id: "email-id" }, error: null };
              },
            },
          };
        },
      };
    }
    if (name === "@/utils/notification-email") return loadNotificationEmail(env);
    throw new Error(`Unexpected require: ${name}`);
  }

  new Script(outputText).runInNewContext({
    console,
    exports: module.exports,
    module,
    process: { env },
    require,
  });
  return module.exports;
}

const details = {
  clickUrl: "https://pawjaipet.com/ads",
  companyName: "Happy Pet Cafe",
  contactEmail: "brand@pawjai.pet",
  contactPhone: "+66970000000",
  endDate: "2026-08-15",
  mediaType: "video",
  recipientEmail: "brand@pawjai.pet",
  startDate: "2026-08-01",
  submissionCode: "AD-ABC12345",
};

test("builds an ad submission confirmation with code, dates, and contact email", () => {
  const { buildAdSubmissionConfirmationEmail } = loadAdEmail({
    env: {
      PAWJAI_EMAIL_FROM: "PawJai <notifications@pawjaipet.com>",
    },
  });
  const email = buildAdSubmissionConfirmationEmail(details);

  assert.equal(email.to, "brand@pawjai.pet");
  assert.equal(email.from, "PawJai <notifications@pawjaipet.com>");
  assert.equal(email.subject, "PawJai ad submission confirmed: AD-ABC12345");
  assert.match(email.text, /Thank you for working with PawJai/);
  assert.match(email.text, /Submission code: AD-ABC12345/);
  assert.match(email.text, /Ad format: Video ad/);
  assert.match(email.text, /Campaign dates: 2026-08-01 to 2026-08-15/);
  assert.match(email.text, /Questions: Contact us at pawjaipet@gmail\.com/);
});

test("uses the verified root sender when ad sender env is missing or unverified", () => {
  const missingEnv = loadAdEmail().buildAdSubmissionConfirmationEmail(details);
  const mailSubdomainEnv = loadAdEmail({
    env: {
      PAWJAI_EMAIL_FROM: "PawJai <notifications@mail.pawjaipet.com>",
    },
  }).buildAdSubmissionConfirmationEmail(details);

  assert.equal(missingEnv.from, "PawJai <notifications@pawjaipet.com>");
  assert.equal(mailSubdomainEnv.from, "PawJai <notifications@pawjaipet.com>");
});

test("sends the ad submission confirmation to the submitted email", async () => {
  const sentMessages = [];
  const { sendAdSubmissionConfirmation } = loadAdEmail({ sentMessages });

  const result = await sendAdSubmissionConfirmation(details);

  assert.equal(result.sent, true);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, "brand@pawjai.pet");
  assert.match(sentMessages[0].text, /Submission code: AD-ABC12345/);
});

test("skips reserved ad recipient domains so tests do not bounce", async () => {
  const sentMessages = [];
  const { buildAdSubmissionConfirmationEmail, sendAdSubmissionConfirmation } = loadAdEmail({ sentMessages });

  assert.equal(
    buildAdSubmissionConfirmationEmail({
      ...details,
      recipientEmail: "brand@example.com",
    }),
    null,
  );
  const skipped = await sendAdSubmissionConfirmation({
    ...details,
    recipientEmail: "brand@example.com",
  });
  assert.equal(skipped.skipped, true);
  assert.equal(sentMessages.length, 0);
});

test("builds and sends the internal PawJai ad submission notification", async () => {
  const sentMessages = [];
  const { buildPawjaiAdSubmissionNotificationEmail, sendPawjaiAdSubmissionNotification } = loadAdEmail({
    env: {
      PAWJAI_ADS_NOTIFICATION_EMAIL: "ads@pawjai.pet",
    },
    sentMessages,
  });
  const email = buildPawjaiAdSubmissionNotificationEmail(details);

  assert.equal(email.to, "ads@pawjai.pet");
  assert.equal(email.subject, "New PawJai ad submission: AD-ABC12345");
  assert.match(email.text, /Contact email: brand@pawjai.pet/);
  assert.match(email.text, /Contact phone: \+66970000000/);
  assert.match(email.text, /Review in PawJai admin > Ads/);

  const result = await sendPawjaiAdSubmissionNotification(details);
  assert.equal(result.sent, true);
  assert.equal(sentMessages.length, 1);
});
