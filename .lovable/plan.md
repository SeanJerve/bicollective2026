

# Implementation Plan: Platform-Wide Fixes & Enhancements

This is a large set of changes spanning shop UX, admin cleanup, search fixes, mobile responsiveness, profile features, vendor tools, and a chat redesign. Due to the scope, it must be implemented across **multiple batches** to avoid quality issues.

---

## Batch 1: Shop Page UX + Search Fix + Admin Cleanup

### 1. Shop Page Sidebar Restructure (`Products.tsx`)
- **Remove Brands column** from both desktop sidebar and mobile filter drawer
- **Categories & Location**: Show only 3 items each by default, add a borderless "View more" / "View less" toggle button
- **Sort dropdown**: Prepend "Sort by:" text label before the select
- **View toggle buttons**: Add Grid (grid icon) and List (list icon) toggle buttons beside sort. Grid = current card layout. List = horizontal row layout with image left, details right

### 2. Search Fix (`SearchAutocomplete.tsx` + `Products.tsx`)
The autocomplete dropdown works but **pressing Enter navigates to `/products?search=X`** where the filtering uses `product.brandName`, `product.category` etc. The issue: the `useProducts` hook maps data but search matching may be too restrictive or products aren't loading.
- Ensure `Products.tsx` search filtering also matches brand `location` field and product `description`
- Make search case-insensitive across all fields
- Verify autocomplete queries aren't blocked by RLS (products RLS only shows `is_active = true`)

### 3. Admin Panel Cleanup
- **Remove Users route and sidebar link**: Delete `/admin/users` route from `App.tsx`, remove from `AdminLayout.tsx` nav, keep `AdminUsers.tsx` file but remove route
- **Remove cart icon for admin**: In `Header.tsx`, hide cart link (`ShoppingBag`) when `isAdmin` is true (both desktop and mobile)
- **Sign out redirect to login**: In `AuthContext.tsx`, the `signOut` function clears state but doesn't navigate. Update `Header.tsx` `handleSignOut` to `navigate("/login")` instead of `navigate("/")`
- **Block voucher rewards for admin/vendor**: Add role checks in the lucky promo popup and voucher claiming logic to skip admin/vendor users

---

## Batch 2: Mobile Responsiveness + Quick Add-to-Cart

### 4. Mobile Text & Layout Adjustments
- Reduce heading sizes on mobile across key pages
- Adjust product card grid: 2 columns on mobile with tighter padding
- Shrink dropdown buttons and filter controls for mobile viewport

### 5. Mobile Quick Add-to-Cart Sheet
- Add a `ShoppingCart` icon button to `ProductCard.tsx` (bottom-right of image, visible on mobile only)
- On tap, open a slide-up bottom sheet (using `vaul` Drawer component) containing:
  - Small square product image (left) + stock count + price (right)
  - Size selector (if product has sizes)
  - Quantity selector (+/- buttons)
  - "Add to Cart" button
  - X close button
- This requires passing stock/size data to ProductCard or fetching on-demand

---

## Batch 3: User Profile + Vendor Page Enhancements

### 6. Profile Picture Upload (`Profile.tsx`)
- Add avatar section at top of profile with current avatar or placeholder
- Upload button to `profile-pictures` storage bucket (create if needed)
- Save URL to `profiles.avatar_url`
- Delete/remove option

### 7. Vendor Store Page Enhancement (`VendorStore.tsx`)
- Replace raw URL inputs for logo/banner with actual file upload components (reuse `DocumentUpload` pattern)
- Add product display settings: highlight best-selling product (select from products dropdown)
- Add product sorting/filter preferences (cheapest, newest, etc.)

### 8. Vendor Analytics Color Fix (`VendorAnalytics.tsx`)
- Replace dark `hsl(var(--foreground))` bar fills with lighter, more readable colors
- Use distinct color palette for charts (e.g., blue, green, amber tones instead of pure black)

### 9. Fix Vendor Register Page
- Investigate why it's "broken and not loading" — likely auth loading state or redirect logic issue
- The code shows it checks for existing application and redirects if already a vendor — may be stuck in `checkingApplication` state

---

## Batch 4: Chat Redesign

### 10. Redesign Chat from Modal to Messenger-Style
Current: `OrderChat.tsx` is a small popup modal per order. Per user feedback, this is not scalable.

New design:
- Create a dedicated `/account/messages` page for customers and `/vendor/messages` for vendors
- Left panel: conversation list (grouped by vendor_order_id, showing other party's name + last message + unread badge)
- Right panel: full-height message thread with the selected conversation
- Mobile: conversation list → tap → full-screen thread with back button
- Reuse existing `messages` table (already has `vendor_order_id`, `sender_id`, `receiver_id`)
- Keep realtime subscription for live updates
- Remove the old popup `OrderChat` component from order cards, replace with "Message" link that navigates to the messages page

---

## Batch 5: Pre-release Products Section for Vendors

### 11. Vendor Pre-release/Teaser Section
- In `VendorProducts.tsx`, add a dedicated tab or section for teaser/pre-order products
- Allow vendors to create products with `listing_type = 'teaser'` easily
- Display these separately on the vendor's public brand page (`BrandDetail.tsx`) under a "Coming Soon" section

---

## Technical Notes

- **Search fix** is the highest-impact bug — autocomplete works but Enter/submit shows no results because the Products page filter checks `product.brandName` and `product.category` which may not match the search text against location or description fields.
- **Admin cart removal** is a simple conditional hide in Header.tsx.
- **Chat redesign** is the largest single feature — it needs a new page, conversation grouping, and mobile layout. This should be its own batch.
- **Mobile quick-add sheet** uses the existing `vaul` Drawer dependency.

---

## Recommended Implementation Order

1. **Batch 1** first (search fix + shop UX + admin cleanup) — fixes critical bugs
2. **Batch 2** (mobile responsiveness) — high visual impact
3. **Batch 3** (profile + vendor enhancements)
4. **Batch 4** (chat redesign) — most complex, standalone feature
5. **Batch 5** (pre-release vendor section) — enhancement

