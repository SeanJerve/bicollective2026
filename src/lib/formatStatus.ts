/** Turn backend status codes into readable labels (e.g. pending_verification → Pending Verification). */
export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
