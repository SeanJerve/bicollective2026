/** Standard platform commission on vendor sales (percent). */
export const DEFAULT_COMMISSION_RATE = 10;

/** Premium vendor commission after admin approval (percent). */
export const PREMIUM_COMMISSION_RATE = 5;

export function resolveCommissionRate(rate: number | null | undefined): number {
  if (rate != null && Number(rate) > 0) return Number(rate);
  return DEFAULT_COMMISSION_RATE;
}

/** Matches checkout: commission on subtotal, rounded to whole pesos. */
export function calcCommissionAmount(subtotal: number, ratePercent: number): number {
  return Math.round((Number(subtotal) * ratePercent) / 100);
}

/** Commission using the brand's current rate (for dashboards & analytics). */
export function calcCommissionAtCurrentRate(
  subtotal: number,
  brandCommissionRate: number | null | undefined
): number {
  return calcCommissionAmount(subtotal, resolveCommissionRate(brandCommissionRate));
}

/** Vendor platform fees at current commission rate + shipping margin from the order. */
export function calcVendorPlatformFees(
  subtotal: number,
  brandCommissionRate: number | null | undefined,
  platformShippingMargin: number | null | undefined
): number {
  return (
    calcCommissionAtCurrentRate(subtotal, brandCommissionRate) +
    Number(platformShippingMargin ?? 0)
  );
}
