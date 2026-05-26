import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === "re_xxxxxxxxx") {
  console.error("Replace RESEND_API_KEY=re_xxxxxxxxx with your real Resend API key before sending.");
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "pawjaipet@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});

if (error) {
  console.error("Resend failed to send the test email:");
  console.error(error);
  process.exit(1);
}

console.log(`Resend test email sent: ${data?.id ?? "no id returned"}`);
