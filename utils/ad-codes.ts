const AD_CODE_PREFIX = "AD";

export function formatAdSubmissionCode(id: string) {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `${AD_CODE_PREFIX}-${compact.slice(0, 8)}`;
}

export function generateAdSubmissionCode() {
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randomPart = Math.floor(Math.random() * 16 ** 3).toString(16).toUpperCase().padStart(3, "0");
  return `${AD_CODE_PREFIX}-${timePart}${randomPart}`;
}
