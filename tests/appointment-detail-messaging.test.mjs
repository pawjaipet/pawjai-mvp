import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("adopter message composer keeps help and return actions under the message box", () => {
  const source = readFileSync(new URL("../components/appointments/AppointmentDetailClient.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("const quickActions = ["), false);
  assert.equal(source.includes("Send update photo"), false);
  assert.equal(source.includes("{showComposerActions && ("), false);
  assert.equal(source.includes("onFocus={() => setShowComposerActions(true)}"), false);
  assert.equal(source.includes("SOS I need help"), true);
  assert.equal(source.includes("Return inquiry"), true);
  assert.equal(source.includes("Contact PawJai admin"), true);
  assert.equal(source.includes("mailto:support@pawjaipet.com"), true);
  assert.equal(source.includes("Call shelter employee"), true);
  assert.equal(source.includes("submitReturnInquiryAction"), true);
  assert.equal(source.includes('name="returnReason"'), true);
  assert.equal(source.includes("Tell us why you need to return"), true);
});

test("adopter message timeline links non-image attachments", () => {
  const source = readFileSync(new URL("../components/appointments/AppointmentDetailClient.tsx", import.meta.url), "utf8");

  assert.equal(source.includes("View attachment"), true);
  assert.equal(source.includes("!isPreviewableImageAttachment(msg.attachmentType) && !isVideoAttachment(msg.attachmentType)"), true);
});
