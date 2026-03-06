
# Comprehensive Audit & Vendor Application System Plan

## Executive Summary

After a thorough scan of Bicollective, here is a detailed audit of what's working, what's missing, and a complete implementation plan for the vendor application and verification system you requested.

---

## PART 1: Current Status Audit

### WORKING FEATURES (100% Functional)

| Module | Feature | Status |
|--------|---------|--------|
| **Customer** | Browse products, brands, categories | Working |
| **Customer** | Location-aware autocomplete search | Working |
| **Customer** | Location filtering on catalogs | Working |
| **Customer** | Add to cart + checkout flow | Working |
| **Customer** | Order history at `/account/orders` | Working |
| **Customer** | Order detail with tracking | Working |
| **Vendor** | Dashboard with stats | Working |
| **Vendor** | Product CRUD with image uploads | Working |
| **Vendor** | Order management + status updates | Working |
| **Vendor** | Store settings with location | Working |
| **Admin** | Dashboard with platform stats | Working |
| **Admin** | Vendor list + verify/suspend actions | Working |
| **Admin** | Reports moderation queue | Working |
| **Auth** | Email/password + Google Sign-In | Working |
| **Auth** | Role-based route protection | Working |
| **Admin** | Cannot access vendor dashboard | Working |

### MISSING OR INCOMPLETE FEATURES

#### Critical Missing (Required for Presentation)

| Priority | Feature | Issue |
|----------|---------|-------|
| **P0** | Payment Proof Upload | Customers cannot upload payment screenshots after checkout |
| **P0** | Vendor Application Flow | No `/vendor/register` page exists - links to 404 |
| **P0** | Vendor Verification Documents | No system for vendors to submit documents for "Verified" badge |
| **P1** | Vendor Reviews Page | `/vendor/reviews` is in navigation but page doesn't exist |
| **P1** | Customer Reviews | ProductDetail shows static "(24 reviews)" - not real data |
| **P1** | Tracking Number Input | Vendors see tracking but cannot enter it |
| **P1** | Admin Products/Orders Pages | Routes exist in nav but pages don't exist |

#### Missing Static Pages (Lower Priority)

| Page | Status |
|------|--------|
| `/vendor/login` | 404 (should redirect to `/login`) |
| `/vendor/guidelines` | 404 |
| `/help` | 404 |
| `/contact` | 404 |
| `/faq` | 404 |
| `/privacy` | 404 |
| `/terms` | 404 |
| `/returns` | 404 |

---

## PART 2: Implementation Plan

### Database Changes Required

A new `vendor_applications` table to store applications:

```text
+-------------------------+
|   vendor_applications   |
+-------------------------+
| id (uuid, PK)           |
| user_id (uuid, FK)      |
| business_name (text)    |
| business_type (enum)    |
|   - established         |
|   - aspiring            |
| location (text)         |
| contact_phone (text)    |
| description (text)      |
| business_permit_url     |
| valid_id_url            |
| proof_of_products_url   |
| status (enum)           |
|   - pending             |
|   - approved            |
|   - needs_resubmission  |
|   - rejected            |
| admin_notes (text)      |
| created_at              |
| updated_at              |
+-------------------------+
```

A new `vendor_verifications` table for verified badge submissions:

```text
+---------------------------+
|  vendor_verifications     |
+---------------------------+
| id (uuid, PK)             |
| brand_id (uuid, FK)       |
| dti_registration_url      |
| bir_certificate_url       |
| mayor_permit_url          |
| additional_docs (text[])  |
| status (enum)             |
|   - pending               |
|   - verified              |
|   - needs_resubmission    |
|   - rejected              |
| admin_notes (text)        |
| submitted_at              |
| reviewed_at               |
+---------------------------+
```

A new storage bucket: `vendor-documents` (private, RLS protected)

---

### Implementation Tasks

#### Task 1: Vendor Application System

**1.1 Create `/vendor/register` page**

A multi-step form with:
- Step 1: Account creation (or login if already registered)
- Step 2: Business type selection
  - "Established Business" (has permits)
  - "Aspiring Seller" (starting out)
- Step 3: Business information
  - Brand/Business name
  - Location (Bicol dropdown)
  - Description
  - Contact phone
- Step 4: Document uploads (varies by type)
  - Established: Business permit, valid ID, product photos
  - Aspiring: Valid ID, product photos
- Step 5: Review and submit

**1.2 File upload component for documents**

Uploads to `vendor-documents` bucket with user-specific paths

**1.3 Application status tracking**

Applicants can view their application status at `/vendor/application-status`

---

#### Task 2: Admin Application Review System

**2.1 Create `/admin/applications` page**

- List all pending applications with filters
- View full application details
- Actions: Approve, Request Resubmission, Reject
- Admin notes field for follow-up instructions

**2.2 Approval workflow**

When approved:
- Create brand entry with status "approved"
- Assign vendor role to user
- Send confirmation (UI toast for now)

When requesting resubmission:
- Update status to "needs_resubmission"
- Store admin notes with specific requirements
- User sees instructions when they check status

---

#### Task 3: Vendor Verification System (for "Verified" Badge)

**3.1 Create `/vendor/verification` page**

For approved vendors to submit verification documents:
- DTI/SEC Registration
- BIR Certificate of Registration
- Mayor's/Business Permit
- Additional supporting documents

**3.2 Create `/admin/verifications` page**

Admin reviews verification submissions:
- View all documents
- Approve (changes brand status to "verified")
- Request resubmission with notes
- Reject with reason

---

#### Task 4: Payment Proof Upload

**4.1 Add upload UI to Order Detail page**

For orders with "pending_payment" status:
- Show upload button for payment screenshot
- Upload to `payment-proofs` bucket
- Update vendor_order status to "payment_uploaded"

---

#### Task 5: Missing Vendor Features

**5.1 Create `/vendor/reviews` page**

- Display all reviews for the vendor's products
- Show product name, rating, comment, date
- Read-only (vendors cannot edit)

**5.2 Add tracking number input to VendorOrders**

When status is "processing" or "shipped":
- Show input field for tracking number
- Save to vendor_orders.tracking_number

---

#### Task 6: Missing Admin Features

**6.1 Create `/admin/products` page**

- List all products across all vendors
- Filter by vendor, category, status
- Actions: Deactivate, View

**6.2 Create `/admin/orders` page**

- List all orders across platform
- Filter by status, date, vendor
- View order details

---

#### Task 7: Customer Reviews

**7.1 Update ProductDetail to show real reviews**

Query reviews table for the product and display actual data

**7.2 Add review submission on OrderDetail**

After order is "delivered", customer can leave a review

---

#### Task 8: Static/Info Pages

Create minimal placeholder pages for:
- `/help` - Help center
- `/faq` - Frequently asked questions
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/returns` - Return policy
- `/vendor/guidelines` - Seller guidelines

---

### File Changes Summary

| New Files | Purpose |
|-----------|---------|
| `src/pages/vendor/VendorRegister.tsx` | Application form |
| `src/pages/vendor/VendorApplicationStatus.tsx` | Track application |
| `src/pages/vendor/VendorVerification.tsx` | Submit verification docs |
| `src/pages/vendor/VendorReviews.tsx` | View product reviews |
| `src/pages/admin/AdminApplications.tsx` | Review applications |
| `src/pages/admin/AdminVerifications.tsx` | Review verifications |
| `src/pages/admin/AdminProducts.tsx` | Manage all products |
| `src/pages/admin/AdminOrders.tsx` | View all orders |
| `src/components/vendor/ApplicationForm.tsx` | Multi-step form |
| `src/components/vendor/DocumentUpload.tsx` | File upload component |
| `src/components/account/PaymentProofUpload.tsx` | Payment screenshot upload |
| `src/components/account/ReviewForm.tsx` | Submit review |
| `src/pages/static/HelpCenter.tsx` | Help page |
| `src/pages/static/FAQ.tsx` | FAQ page |
| `src/pages/static/Contact.tsx` | Contact page |
| `src/pages/static/Privacy.tsx` | Privacy policy |
| `src/pages/static/Terms.tsx` | Terms page |
| `src/pages/static/Returns.tsx` | Returns page |
| `src/pages/static/SellerGuidelines.tsx` | Vendor guidelines |

| Modified Files | Changes |
|----------------|---------|
| `src/App.tsx` | Add new routes |
| `src/pages/account/OrderDetail.tsx` | Add payment proof upload |
| `src/pages/vendor/VendorOrders.tsx` | Add tracking input |
| `src/pages/ProductDetail.tsx` | Display real reviews |
| `src/components/layout/AdminLayout.tsx` | Add new nav items |
| `src/components/layout/Footer.tsx` | Fix footer links |

---

### Technical Approach

**Vendor Application Flow**
```text
User clicks "Become a Vendor"
         |
         v
   /vendor/register
         |
         v
  Fill application form
  (business type, info, documents)
         |
         v
  Submit -> status: "pending"
         |
         v
  Admin reviews at /admin/applications
         |
    +----+----+
    |         |
 Approve   Need Changes
    |         |
    v         v
 Brand      Status:
 created    "needs_resubmission"
 + role     + admin notes
 assigned   shown to user
```

**Verification Flow (Separate from Application)**
```text
Approved vendor
wants "Verified" badge
         |
         v
   /vendor/verification
         |
         v
  Upload official documents
  (DTI, BIR, Mayor's permit)
         |
         v
  Submit -> status: "pending"
         |
         v
  Admin reviews at /admin/verifications
         |
    +----+----+
    |         |
 Verify    Need Changes
    |         |
    v         v
 Brand      Status:
 status ->  "needs_resubmission"
 "verified" + admin notes
```

---

### Database Migration SQL

```sql
-- Vendor Applications
CREATE TYPE vendor_application_status AS ENUM (
  'pending', 'approved', 'needs_resubmission', 'rejected'
);

CREATE TYPE business_type AS ENUM ('established', 'aspiring');

CREATE TABLE vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  business_type business_type NOT NULL,
  location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  description TEXT,
  business_permit_url TEXT,
  valid_id_url TEXT,
  proof_of_products_url TEXT,
  status vendor_application_status DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Verifications
CREATE TYPE vendor_verification_status AS ENUM (
  'pending', 'verified', 'needs_resubmission', 'rejected'
);

CREATE TABLE vendor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  dti_registration_url TEXT,
  bir_certificate_url TEXT,
  mayor_permit_url TEXT,
  additional_docs TEXT[],
  status vendor_verification_status DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-documents', 'vendor-documents', false);
```

---

### Estimated Scope

| Category | Items | Effort |
|----------|-------|--------|
| New Pages | 17 | Medium-High |
| Database Tables | 2 | Low |
| Storage Bucket | 1 | Low |
| Component Updates | 6 | Medium |
| Route Updates | 1 | Low |

This plan covers all essential functionality for a working presentation-ready system with proper vendor application, admin review, verification workflow, payment proof uploads, and missing features.

