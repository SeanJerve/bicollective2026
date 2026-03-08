# Bicollective — Comprehensive Audit & Priority Roadmap

---

## Current Status: What's Working


| Area                   | Features                                                                                                              | Status  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ------- |
| **Storefront**         | Product browsing, search autocomplete, category/brand filtering, location-aware search                                | Working |
| **Cart & Checkout**    | Multi-vendor cart with selective checkout, vouchers, promo codes, shipping calc, COD/GCash/Bank payment methods       | Working |
| **Vendor Application** | 4-step registration form, admin review (approve/reject/resubmit), inline doc resubmission                             | Working |
| **Vendor Dashboard**   | Stats, product CRUD, order management, tracking input, promotions, reviews, store settings, sale targeting            | Working |
| **Admin Panel**        | Dashboard stats, vendor management, applications, verifications, reports, disputes, promotions, vouchers, lucky promo | Working |
| **Auth**               | Email/password, Google OAuth, role-based routing (admin/vendor/customer)                                              | Working |
| **Orders**             | Customer order history, order detail, payment proof upload, vendor-customer chat, review submission with media        | Working |
| **Loyalty**            | Auto voucher rewards at 5 deliveries and 10 unique sellers                                                            | Working |
| **Notifications**      | Real-time badge counts for admin/vendor/customer via Supabase realtime                                                | Working |
| **Pre-order/Teaser**   | Teaser listings with coming soon badges, pre-order discounts                                                          | Working |
| **Verification**       | Vendor verified badge workflow (DTI/BIR/Mayor permit submission + admin review)                                       | Working |


---

## PRIORITY 1 — Critical Bugs & Missing Logic

### 1.1 COD Order Flow is Broken

**Problem**: When a customer selects COD, the vendor order is created with status `pending_payment`. The vendor's order filters show `payment_uploaded` and `paid` as the first actionable states. There is no way for a vendor to process a COD order — they're stuck at `pending_payment` because the code expects a payment proof upload that COD orders don't have.

**Fix**: COD orders should skip the payment verification step entirely. Set COD orders to status `paid` (or a new `confirmed` status) immediately so vendors can start processing.

**Files**: `src/pages/Checkout.tsx` (line 331), `src/pages/vendor/VendorOrders.tsx` (filters + actions)

### 1.2 Payment Proof Upload Missing from Order Detail

**Problem**: `PaymentProofUpload` component exists but is never rendered in `OrderDetail.tsx`. Customers who chose GCash/Bank Transfer can't upload payment proof after checkout.

**Fix**: Import and render `PaymentProofUpload` in `OrderDetail.tsx` for vendor orders with `pending_payment` status and non-COD payment method.

**Files**: `src/pages/account/OrderDetail.tsx`

### 1.3 `reviews_user_id_fkey` Foreign Key Missing

**Problem**: `ProductDetail.tsx` line 46 uses `.select('*, profile:profiles!reviews_user_id_fkey(full_name, avatar_url)')` but the `reviews` table has no foreign key to `profiles`. This query likely fails silently or returns null for profile data.

**Fix**: Either add a foreign key from `reviews.user_id` to `profiles.user_id`, or change the query to a two-step fetch.

**Files**: DB migration, `src/pages/ProductDetail.tsx`

### 1.4 Vendor Dashboard Route Not Protected by Vendor Role

**Problem**: The vendor routes at `/vendor/*` only require `requireAuth` — any authenticated user (even a customer) can access the vendor dashboard. If they have no brand, the page shows empty state but still loads.

**Fix**: Add `requireVendor` to the vendor route protection, or add an in-component redirect for non-vendor users.

**Files**: `src/App.tsx` (line 140), `src/components/ProtectedRoute.tsx`

---

## PRIORITY 2 — Incomplete Features

### 2.1 Order Status Pipeline Mismatch

**Problem**: The `order_status` enum in the database includes states like `for_delivery`, `handed_to_courier`, `confirmed` — but the vendor order management UI (`VendorOrders.tsx`) only handles: `payment_uploaded → paid → processing → shipped → delivered`. The richer pipeline from the plan (confirmed → handed_to_courier → for_delivery → delivered) is partially implemented in status labels but not in vendor actions.

**Fix**: Expand the vendor UI to support the full pipeline. The `auto-deliver-orders` edge function references `for_delivery` status but vendor UI never sets it.

### 2.2 Admin Analytics Page is "Coming Soon"

**Problem**: `AdminAnalytics.tsx` exists as a route but the admin layout marks it as `comingSoon: true` and redirects to `/coming-soon`.

**Fix**: Build out the analytics page with the essentials and make sure its completely working.

### 2.3 Vendor Dashboard Sidebar Not Responsive (Mobile)

**Problem**: Both `VendorLayout.tsx` and `AdminLayout.tsx` use a fixed `w-64` sidebar with no mobile hamburger menu. On mobile screens, the sidebar takes half the viewport with no collapse option.

**Fix**: Add a mobile-responsive sidebar with toggle.

### 2.4 Footer "Vendor Dashboard" Link is Wrong

**Problem**: Footer links to `/vendor/dashboard` when vendor is logged in, but the actual route is `/vendor`.

**Fix**: Change href from `/vendor/dashboard` to `/vendor` in `Footer.tsx` line 16.

### 2.5 Product Size Selection Hardcoded

**Problem**: `ProductDetail.tsx` line 113 hardcodes `["XS", "S", "M", "L", "XL", "XXL"]` regardless of the product's actual `sizes` array from the database. Products may have different available sizes.

**Fix**: Use `product.sizes` instead of the hardcoded array.

---

## PRIORITY 3 — Missing Real-World Features

### 3.1 No Email Notifications

**Problem**: All status updates (order confirmed, shipped, delivered, application approved/rejected) are only shown via in-app toasts. No email notifications exist.

**Fix**: Create edge functions that send transactional emails on key events using a service like Resend or the built-in Lovable AI email capability.

### 3.2 No Order Cancellation by Customer

**Problem**: Customers cannot cancel orders. There's no cancel button on the order detail page. Only vendors can set status to `cancelled`.

**Fix**: Add cancel button for orders in `pending_payment` and make sure that when the order is confirmed by the vendor, the customers cancel option is grayed or disabled since the order is now being processed.

### 3.3 No Pagination

**Problem**: All list pages (products, orders, reviews, admin tables) load all records at once. With growth, this will hit the 1000-row Supabase limit and cause performance issues.

**Fix**: Add pagination to key list pages: Products, Orders (customer + vendor + admin), Admin Applications, Admin Vendors. Make sure it wont cause performance issues.

### 3.4 No Product Search in Admin

**Problem**: Admin Products page has no search/filter capability for finding specific products across vendors.  
  
Fix this.

### 3.5 No Dispute Resolution Flow for Customers

**Problem**: `Disputes.tsx` exists and customers can create disputes, but there's no clear UI for viewing dispute progress or admin responses.  
  
Fix this.

### 3.6 No Inventory Management Alerts

**Problem**: Low stock badge count works but there's no actual alert or notification pushed to vendors when stock hits zero.  
  
Fix this.

---

## PRIORITY 4 — UX & Polish

### 4.1 Hero Section is Currently Blank

**Problem**: The hero background image was removed (per your request to make it plain white). Needs a new design or image.

### 4.2 No Loading States on Some Admin Pages

**Problem**: Some admin pages load data without skeleton states, showing empty content briefly.  
  
Fix this.

### 4.3 No Breadcrumb Navigation on Account Pages

**Problem**: Profile, Wishlist, Vouchers pages lack breadcrumb navigation for consistency.  
  
Fix this.

### 4.4 No Dark Mode Toggle

**Problem**: `next-themes` is installed but no toggle exists in the UI.  
  
Fix this.

---

## PRIORITY 5 — Database & Infrastructure

### 5.1 Migration Files Are Unlabeled

**Problem**: All 12 migration files use auto-generated UUIDs like `20260129004554_77b6af0b-6420-42fd-9cb6-da65161ab0ae.sql`. They're unreadable and impossible to track changes.

**Recommendation**: Going forward, all new migrations will use descriptive names like `20260308_fix_cod_order_flow.sql`, `20260308_add_reviews_profile_fkey.sql`.

### 5.2 No Database Triggers Registered

**Problem**: The audit shows "There are no triggers in the database" — but functions like `handle_new_user`, `update_brand_rating`, `update_loyalty_on_delivery`, `decrement_stock_on_order` exist. Either the triggers were dropped or never created.

**Impact**: New user signups may not create profiles/roles. Order deliveries may not update loyalty. Stock may not decrement. Reviews may not update brand ratings.

**Fix**: Verify and recreate all necessary triggers.

### 5.3 Realtime Not Enabled on Key Tables

**Problem**: No `ALTER PUBLICATION supabase_realtime ADD TABLE` statements found. Realtime subscriptions in `useNotifications.ts` may not receive events.

**Fix**: Enable realtime on `vendor_orders`, `vendor_applications`, `vendor_verifications`, `reports`, `disputes`, `reviews`, `products`.

---

## Implementation Order

```text
Phase 1 (Critical — Do First)
├── 1.1 Fix COD order flow
├── 1.2 Add PaymentProofUpload to OrderDetail
├── 1.3 Fix reviews foreign key
├── 1.4 Fix vendor route protection
├── 2.4 Fix footer vendor dashboard link
├── 2.5 Fix product sizes from DB
└── 5.2 Verify/create DB triggers

Phase 2 (Important — Core UX)
├── 2.1 Align order status pipeline
├── 2.3 Mobile-responsive admin/vendor sidebar
├── 3.2 Customer order cancellation
├── 3.1 Email notifications (edge functions)
└── 5.3 Enable realtime on tables

Phase 3 (Growth & Scale)
├── 3.3 Pagination on list pages
├── 3.4 Admin product search
├── 3.5 Dispute resolution UI
├── 2.2 Admin analytics page
└── 3.6 Inventory alerts

Phase 4 (Polish)
├── 4.1 Hero section redesign
├── 4.2 Loading states
├── 4.3 Breadcrumbs
└── 4.4 Dark mode toggle
```

---

## Commit & Migration Conventions (Going Forward)

**Commit messages** will follow this format:

```
feat(vendor): fix COD order flow to skip payment verification
fix(checkout): set COD orders to paid status on creation
refactor(admin): add mobile sidebar toggle to AdminLayout
```

**Migration files** will be labeled descriptively:

```
20260308_fix_cod_order_flow.sql
20260308_add_reviews_profile_fkey.sql  
20260308_verify_database_triggers.sql
20260308_enable_realtime_tables.sql
```

---

## Recommended Next Move

Start with **Phase 1** as a single batch — these are all bugs that would break the app in a real demo or presentation. The COD flow fix and payment proof upload are the most user-facing. The trigger verification is critical infrastructure that could explain silent failures.