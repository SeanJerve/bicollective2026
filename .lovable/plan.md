

# Full Audit: Fixes & Missing Essentials

## Part 1: Admin Dropdown Cleanup

For admin users, hide irrelevant customer menu items (Orders, To Review, Wishlist, Vouchers, Profile) instead of showing them grayed out. Admin dropdown should only show: **Admin Panel** and **Sign Out**.

**Files:** `src/components/layout/Header.tsx` (desktop dropdown lines 122-138, mobile menu lines 294-307)

---

## Part 2: Issues Found & Fixes

### A. Functional Bugs

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | **Review media URLs use `getPublicUrl` on potentially private bucket** | `ToReview.tsx:81-84` | If `review-media` bucket is public, fine. If not, use signed URLs. Need to verify bucket config. |
| 2 | **Wishlist "Add to Cart" hardcodes size "M"** | `Wishlist.tsx:80` | Should either omit size or let user pick. For now, pass `null`/empty and let the cart handle it. |
| 3 | **Profile `setDefault` doesn't unset previous default** | `Profile.tsx:96-108` | Setting one address as default doesn't unset others. Need a DB trigger or update-all-then-set pattern. |
| 4 | **VendorOrders still uses `useEffect` not `useQuery`** | `VendorOrders.tsx:40-91` | Refactor to `useQuery` for consistency, caching, and error handling (from previous audit, not yet done). |
| 5 | **Checkout doesn't validate stock before placing order** | `Checkout.tsx:278-403` | No stock check at submission time. Two users could buy the last item simultaneously. Add stock validation in the submit handler. |
| 6 | **VendorDashboard and AdminDashboard use raw `useEffect`** | Both dashboards | These fire many parallel queries without caching. Should use `useQuery` for consistency (lower priority). |

### B. Missing Essential Features (implementable)

| # | Feature | Why Essential | Scope |
|---|---------|---------------|-------|
| 7 | **Order cancellation stock restore** | When a vendor order is cancelled, product stock should be restored. Currently stock is never decremented/restored. | DB trigger or edge function |
| 8 | **Stock decrement on order placement** | Products have `stock` field but checkout never decrements it. `in_stock` remains true even when stock hits 0. | Add stock update in checkout submit |
| 9 | **Email notifications for order status changes** | Buyers have no way to know their order status changed unless they check the app. At minimum, system should show in-app notifications. | Already partially done via `messages` table, but no notification center UI |
| 10 | **Password change in Profile** | Profile page shows email but has no option to change password. Essential for account security. | Add password change form in Profile.tsx |
| 11 | **Vendor payment proof signed URL for admins** | Admin orders page doesn't display payment proofs at all. Admins should be able to view them for dispute resolution. | Add proof display to AdminOrders |

### C. UX/Responsiveness Polish

| # | Issue | Fix |
|---|-------|-----|
| 12 | **Checkout page has no back/cancel button** | Add a "Back to Cart" link at the top |
| 13 | **Mobile: Admin sidebar has no breadcrumb context** | The mobile admin header just says "BICOLLECTIVE" with no indication of current page |
| 14 | **Empty state for vendor with no brand** | VendorDashboard/VendorOrders show blank page if brand not found. Should show a helpful message. |

---

## Part 3: Implementation Plan

### Priority 1 (this batch)
1. **Admin dropdown cleanup** — Hide customer items for admin users in both desktop and mobile menus
2. **Wishlist size fix** — Remove hardcoded "M" size
3. **Address default fix** — Unset other defaults when setting a new one
4. **Stock decrement on checkout** — Decrease product stock when order is placed
5. **Checkout back button** — Add navigation back to cart
6. **Password change in Profile** — Add change password form

### Priority 2 (next batch)
7. VendorOrders refactor to useQuery
8. Admin payment proof display
9. Stock restore on cancellation
10. Vendor empty brand state messages

### Technical Details

**Admin dropdown (Header.tsx):**
- Filter `userMenuItems` array: if `isAdmin`, don't render customer items at all
- Mobile menu: same treatment, only show Admin Panel + Sign Out for admin users

**Address default (Profile.tsx):**
- Before setting new default, run `UPDATE addresses SET is_default = false WHERE user_id = X AND id != selectedId`

**Stock decrement (Checkout.tsx):**
- After order items are inserted, loop through and decrement each product's stock
- Set `in_stock = false` when stock reaches 0

**Password change (Profile.tsx):**
- Add a collapsible section with current password (not needed for Supabase `updateUser`), new password, confirm password
- Call `supabase.auth.updateUser({ password: newPassword })`

