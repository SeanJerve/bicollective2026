export function hasActiveAdBoost(adBoosts: { status?: string; starts_at?: string | null; ends_at?: string | null }[] | null | undefined): boolean {
  const now = new Date();
  return (adBoosts || []).some(
    (b) =>
      b.status === "active" &&
      (!b.starts_at || new Date(b.starts_at) <= now) &&
      (!b.ends_at || new Date(b.ends_at) >= now)
  );
}

export function hasPendingAdBoost(adBoosts: { status?: string }[] | null | undefined): boolean {
  return (adBoosts || []).some((b) => b.status === "pending");
}

/** Boosted products first for customer listings. */
export function compareBoostedProducts<T extends { isBoosted?: boolean }>(a: T, b: T): number {
  return (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0);
}
