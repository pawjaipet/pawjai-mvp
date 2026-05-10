const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseAdDateRange(startDateValue: unknown, endDateValue: unknown) {
  const startDate = String(startDateValue ?? "").trim();
  const endDate = String(endDateValue ?? "").trim();

  if (!startDate || !endDate) {
    throw new Error("Start and end dates are required.");
  }

  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
    throw new Error("Dates must use YYYY-MM-DD format.");
  }

  if (endDate < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  return { endDate, startDate };
}
