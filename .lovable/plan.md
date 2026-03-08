# Comprehensive Audit: Functionality, Performance & Responsiveness

After a thorough review of the entire codebase, here are the issues found and proposed fixes, organized by priority.

---

## Critical Functionality Issues

### 1. Header User Menu Z-Index Conflict

The click-outside overlay in `Header.tsx` (line 373-378) uses `z-40`, but the user dropdown menu itself is `z-50`. The overlay sits *behind* the sticky header (`z-50`), so clicks on the dropdown content inadvertently close it. The overlay should be `z-[45]` or the dropdown wrapper restructured.

**Fix:** Change the overlay z-index from `z-40` to `z-[45]` and ensure the dropdown container is positioned correctly relative to the overlay.

### 2. Cart Selection Not Pre-Populated

In `Cart.tsx`, `selectedIds` starts as an empty `Set`. Users must manually select items before they can checkout. Most e-commerce platforms pre-select all items by default.

**Fix:** Initialize `selectedIds` with all item IDs using a `useEffect` that runs when items load, so all items are selected by default.

### 3. Review Profiles Fetch Fails for Other Users

In `ProductDetail.tsx` (line 57), reviews fetch profiles using `.in("user_id", userIds)`. The `profiles` table has RLS policy: `auth.uid() = user_id` (SELECT). This means a logged-in user can only see *their own* profile, not other reviewers' profiles. Reviews will show without names/avatars for other users.

**Fix:** Add a SELECT policy on `profiles` for authenticated users to view `full_name` and `avatar_url` of other users, OR create a database view/function that returns reviewer display info without exposing full profile data.

### 4. Checkout Race Condition with Non-COD Payments

In `Checkout.tsx`, when `paymentMethod !== "cod"` and a proof file is uploaded, the `payment-proofs` bucket is non-public (`Is Public: No`), but line 298-299 calls `getPublicUrl()`. This returns a URL that won't be accessible without auth. Vendors viewing the proof in their orders dashboard won't be able to see it unless they have storage access.

**Fix:** Use signed URLs or create storage RLS policies that allow brand owners to access payment proofs for their orders.

---

## Moderate Functionality Issues

### 5. Vendor Orders Page Uses `useEffect` Instead of React Query

`VendorOrders.tsx` fetches data with raw `useEffect`/`useState` instead of `useQuery`, losing caching, refetch-on-focus, and error/loading patterns used elsewhere. This is inconsistent and less performant.

**Fix:** Refactor to use `useQuery` like other pages for consistency and automatic cache management.

### 6. Missing `useCallback` Dependency Warning in CartContext

`CartContext.tsx` line 97: `useEffect(() => { fetchCart(); }, [user])` — `fetchCart` is not in the dependency array and is recreated on every render. This could cause stale closure issues.

**Fix:** Wrap `fetchCart` in `useCallback` with `[user]` dependency, or restructure to avoid the warning.

### 7. Notification Counts Fire Too Many Queries

`useNotifications.ts` fires 4-5 parallel count queries on every realtime event (any row change in applications, verifications, reports, disputes tables). No debouncing is applied, so rapid changes cause query storms.

**Fix:** Add a debounce (e.g., 2 seconds) to the `fetchCounts` callback triggered by realtime events.

---

## Performance Issues

### 8. Products Page Client-Side Filtering Only

`Products.tsx` loads ALL products then filters client-side. For large catalogs, this is inefficient. Currently acceptable with small data sets but won't scale.

**Fix (future):** Move filtering to Supabase query parameters. For now, implement a solution that can handle a small side project data set an document as a known limitation — acceptable for current data volume.

### 9. SaleBanner Interval Runs Even When Not Visible

`SaleBanner.tsx` runs a `setInterval` every 1 second for the countdown timer. This continues even when the banner is dismissed (the component returns `null` but the effect still runs since it's set up before the early return).

**Fix:** Move the `useEffect` for the interval after the early return guard, or add `dismissed` to the guard logic inside the effect.

### 10. Duplicate Brand Data Fetching in `useBrands`

`useBrands()` makes two queries: one for brands, then another for product counts per brand. The second query selects `brand_id` for all active products. This could use a single query with a count join or an RPC.

**Fix (minor):** Acceptable for now — optimize later if brand count grows significantly. Implement a fix that can handle our targeted number of brands as side projects which is 10 brands.

---

## Responsiveness Issues

### 11. Checkout Page Long Form on Mobile

The checkout form at `Checkout.tsx` is a single long column with no visual grouping or collapsible sections. On mobile, users scroll extensively.

**Fix:** Add collapsible accordion sections for Address, Payment Method, Vouchers, and Order Summary on mobile. Use the existing Accordion component.

### 12. Order Detail Status Badge Colors

In `OrderDetail.tsx`, the `for_delivery` status uses `bg-accent text-accent-foreground`. In the default light theme, accent is `hsl(0 0% 88%)` (light gray) with black text — nearly invisible against the card background. Other pages use `bg-primary` for this status.

**Fix:** Align `for_delivery` status color to `bg-primary text-primary-foreground` for consistency with `Orders.tsx`.

### 13. Footer "Vendor Login" Link Goes to Redirect

Footer shows "Vendor Login" link pointing to `/vendor/login`, which just redirects to `/login`. This is correct but the link text is misleading — there's no separate vendor login flow.

**Fix:** Change the label to "Vendor Sign In" or remove it entirely since vendors use the same login page.

---

## Summary of Changes


| #   | File                  | Change                                                |
| --- | --------------------- | ----------------------------------------------------- |
| 1   | `Header.tsx`          | Fix user menu overlay z-index                         |
| 2   | `Cart.tsx`            | Pre-select all items on load                          |
| 3   | DB Migration          | Add profiles SELECT policy for reviewer display names |
| 4   | `Checkout.tsx`        | Use signed URLs for payment proof access              |
| 5   | `VendorOrders.tsx`    | Refactor to useQuery (optional, consistency)          |
| 6   | `CartContext.tsx`     | Add useCallback to fetchCart                          |
| 7   | `useNotifications.ts` | Debounce realtime-triggered refetches                 |
| 8   | -                     | No change needed now (note for scale)                 |
| 9   | `SaleBanner.tsx`      | Fix interval cleanup when dismissed                   |
| 10  | -                     | No change needed now                                  |
| 11  | `Checkout.tsx`        | Add collapsible sections for mobile                   |
| 12  | `OrderDetail.tsx`     | Fix for_delivery status color                         |
| 13  | `Footer.tsx`          | Update "Vendor Login" label                           |


I recommend implementing fixes 1-4, 6-7, 9, 12-13 first as they are the most impactful with minimal risk. Fix 5 and 11 are larger refactors that can follow.