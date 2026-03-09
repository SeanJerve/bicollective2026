

# Full Platform Audit — Bicollective

## A. DATABASE: Duplicate Triggers (Critical)

The `order_items` table has **3 duplicate triggers** all calling the same `decrement_stock_on_order` function:
- `decrement_stock_on_order_item`
- `on_order_item_created`
- `trg_decrement_stock_on_order`

**Impact**: Stock is decremented **3x** per order item instead of 1x. A customer buying qty 1 reduces stock by 3.

The `addresses` table has **4 duplicate triggers** all calling `unset_other_default_addresses`:
- `on_address_default_change`
- `trg_unset_other_default_addresses`
- `trg_unset_other_default_addresses_insert`
- `trigger_unset_other_defaults`

**Impact**: Redundant executions on every address change. Not functionally harmful but wasteful and violates DBMS hygiene.

**Fix**: Drop duplicates, keep one trigger per function per table.

---

## B. DATABASE: Schema Quality Review

| Table | Issue | Severity |
|-------|-------|----------|
| `categories.product_count` | Static column, never updated. `useCategory` hook already counts dynamically. Stale data. | Low — cosmetic |
| `reviews` | No `media_urls` column despite `ToReview.tsx` uploading media to `review-media` bucket. Media URLs are generated but **never stored** in the review row. | Medium — data loss |
| `vendor_applications` | `user_id` FK references `auth.users` which is acceptable but NOT listed in foreign keys output — missing explicit FK constraint? | Low |
| `vendor_verifications` | `brand_id` references `brands` — correct, FK exists | OK |
| `messages` | Has realtime but no `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages` confirmed | Needs verification |
| `loyalty_progress` | Properly structured, trigger-driven. No issues. | OK |
| `lucky_promo_claims` | `claimed_date` uses `CURRENT_DATE` default — correct. Unique constraint on (user_id, claimed_date) not visible but enforced by code logic. | Minor |

---

## C. FRONTEND: Unused/Dead Code

| File | Issue |
|------|-------|
| `src/data/mockData.ts` (262 lines) | Only imported by `Categories.tsx`. Categories page should use `useCategories()` hook from real DB instead. **mockData.ts is dead weight.** |
| `src/pages/Categories.tsx` | Uses static mock data instead of Supabase — **shows hardcoded categories, not real ones** |

---

## D. FRONTEND-BACKEND GAPS

| Feature | Frontend | Backend | Gap |
|---------|----------|---------|-----|
| Review media upload | `ToReview.tsx` uploads to `review-media` bucket | `reviews` table has no `media_urls` column | **Media uploaded but never linked to review record** |
| Category product count | `categories.product_count` column exists | Never updated by any trigger | Stale — always shows 0. Hooks compute dynamically which is fine, but the column is wasted. |
| `Size Guide` button | ProductDetail.tsx line 289 | No size guide data/page exists | Button does nothing |
| Wishlist toggle on ProductDetail | Heart icon exists in code but **not rendered in the JSX** — `toggleWishlist` function defined but no UI button calls it | — | Wishlist button missing from product page |
| `categories` static import | `Categories.tsx` imports from `mockData` | Real `categories` table exists with data | **Shows mock data instead of real categories** |

---

## E. FLOW AUDIT BY ROLE

### Customer Flow
| Step | Status | Notes |
|------|--------|-------|
| Browse products/brands/categories | Working | Categories page uses mock data — **broken** |
| Search with autocomplete | Working | |
| Add to cart | Working | |
| Checkout (COD) | Working | Stock decremented **3x** due to duplicate triggers |
| Checkout (GCash/Bank) | Working | Payment proof upload functional |
| View orders | Working | |
| Cancel order | Working | Stock restored correctly (single trigger) |
| Leave review | Working | Media files uploaded but not saved to DB |
| Wishlist | Working from Wishlist page | Cannot add from ProductDetail page (no button) |
| Disputes | Working | |
| Vouchers | Working | |
| Password change | Working | Added in Priority 1 |
| Address management | Working | Default toggle works (though fires 4 triggers) |

### Vendor Flow
| Step | Status | Notes |
|------|--------|-------|
| Application | Working | |
| Dashboard | Working | Uses raw useEffect, not useQuery |
| Products CRUD | Working | |
| Orders management | Working | Refactored to useQuery |
| Tracking number | Working | |
| Store settings | Working | |
| Reviews | Working | |
| Analytics | Working | Uses raw useEffect |
| Promotions | Working | |
| Verification submission | Working | |
| Empty brand state | Working | Added in Priority 2 |

### Admin Flow
| Step | Status | Notes |
|------|--------|-------|
| Dashboard | Working | Uses raw useEffect |
| Applications review | Working | |
| Verifications review | Working | |
| Vendors management | Working | |
| Products management | Working | |
| Orders with payment proof | Working | Added in Priority 2 |
| Reports moderation | Working | |
| Disputes resolution | Working | |
| Promotions | Working | |
| Vouchers | Working | |
| Lucky Promo config | Working | |
| Analytics | Working | |
| Users management | Working | |
| Dropdown cleanup | Working | Only Admin Panel + Sign Out |

---

## F. SECURITY REVIEW

| Area | Status |
|------|--------|
| RLS on all tables | All tables have RLS enabled with appropriate policies |
| Roles in separate `user_roles` table | Correct — not on profiles |
| `SECURITY DEFINER` functions | `has_role`, `get_brand_owner`, stock triggers — correct |
| Private storage buckets | `payment-proofs` and `vendor-documents` are private — correct |
| Admin-only edge functions | `admin-list-users` uses service role key — correct |
| No client-side role checks for security | Auth uses server-side role queries — correct |
| Cart RLS | Scoped to user_id — correct |

---

## G. IMPLEMENTATION PLAN (Priority Order)

### Batch 1: Critical Database Fixes

**1. Drop duplicate triggers** (migration)
```sql
-- order_items: keep only trg_decrement_stock_on_order
DROP TRIGGER IF EXISTS decrement_stock_on_order_item ON order_items;
DROP TRIGGER IF EXISTS on_order_item_created ON order_items;

-- addresses: keep only trg_unset_other_default_addresses
DROP TRIGGER IF EXISTS on_address_default_change ON addresses;
DROP TRIGGER IF EXISTS trg_unset_other_default_addresses_insert ON addresses;
DROP TRIGGER IF EXISTS trigger_unset_other_defaults ON addresses;
```

**2. Add `media_urls` column to reviews table** (migration)
```sql
ALTER TABLE reviews ADD COLUMN media_urls text[] DEFAULT '{}';
```
Then update `ToReview.tsx` and `ReviewForm.tsx` to save URLs.

**3. Fix stock for orders already affected** — manually audit and correct stock quantities for products with triple-decremented stock.

### Batch 2: Frontend Fixes

**4. Fix Categories page** — Replace mock data import with `useCategories()` hook from `useProducts.ts`. Delete `mockData.ts` entirely.

**5. Add Wishlist button to ProductDetail** — The `toggleWishlist` function already exists but no UI button is rendered. Add Heart icon button near the cart/buy buttons.

**6. Remove or implement Size Guide** — Either link to a real size guide or remove the non-functional button.

### Batch 3: Consistency Improvements

**7. VendorDashboard + AdminDashboard** — Refactor from raw `useEffect` to `useQuery` for consistency with the rest of the app. (Lower priority, functional as-is.)

**8. Drop `categories.product_count` column** — It's never updated and all code computes counts dynamically. Remove to avoid confusion.

**9. Review `VendorReviews.tsx`** — Currently doesn't show reviewer names. Should join profiles table like ProductDetail does.

### Batch 4: Future Enhancements (from past plans)

| Feature | Source |
|---------|--------|
| In-app notification center UI | Past audit — `messages` table exists, notifications computed but no UI bell/drawer |
| Mobile admin breadcrumb | Past audit — mobile admin header lacks page context |
| Email notifications for order status | Original plan — not implemented |
| Realtime for messages table | Table exists, RLS set, but publication not confirmed |
| Stock validation pre-checkout | Past audit — race condition still possible (two users, last item) |

---

## H. SUMMARY OF CHANGES MADE THIS SESSION

| Change | Result |
|--------|--------|
| Admin dropdown cleanup | Only Admin Panel + Sign Out for admins |
| Wishlist size fix | No longer hardcodes "M" |
| Address default trigger | Works but has 4 duplicate triggers |
| Stock decrement trigger | Works but fires 3x per item |
| Back to Cart button | Added to Checkout |
| Password change | Added to Profile page |
| VendorOrders useQuery refactor | Working with query invalidation |
| Admin payment proof display | Signed URLs in Orders table |
| Stock restore on cancellation | Working (single trigger, correct) |
| Vendor empty brand state | Shows helpful message + link |

**Most critical immediate action**: Drop duplicate triggers to fix 3x stock decrement and 4x address trigger firing.

