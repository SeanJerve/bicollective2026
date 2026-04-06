# Bicollective 2026 — Complete Database Documentation
### Every Table. Every Column. Every Reason Why.

> This document justifies every design decision in our normalized database. Use it to confidently answer any question your professor asks.

---

## GROUP 1: AUTHENTICATION & USER IDENTITY

### `auth.users` (Supabase Internal)
**Purpose:** This is Supabase's built-in authentication table. We do NOT own or manage this table. It stores raw login credentials. We reference it via `id` everywhere but never store sensitive auth data ourselves.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID primary key. Every other table in our system links to this to identify who a user is. |
| `email` | Managed exclusively by Supabase Auth for login. This is the ONLY place email lives (we removed the duplicate from `profiles`). |

---

### `profiles`
**Purpose:** Extends `auth.users` with public-facing customer data. This is a 1-to-1 subtype of `auth.users`.
**Why separate from `auth.users`?** Security. `auth.users` is locked down by Supabase. We cannot freely access or join it in queries. `profiles` holds what we CAN read publicly.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK for this profile row. |
| `user_id` | FK → `auth.users.id`. Links this profile to the authenticated user. |
| `full_name` | The display name shown across the platform (checkout, reviews, messages). |
| `phone` | Contact number used for delivery coordination. |
| `avatar_url` | URL to the user's profile picture in Supabase Storage. |
| `created_at` | Audit trail — when this profile was first created. |
| `updated_at` | Audit trail — when profile info was last changed. |

> **Why no `email` here?** Email lives exclusively in `auth.users`. Storing it again would violate 3NF — it would be a non-key attribute functionally dependent on `user_id`, not on `profiles.id`.

---

### `user_roles`
**Purpose:** Stores what role(s) a user has on the platform (admin, vendor, customer).
**Why separate from `profiles`?** A user can hold multiple roles simultaneously (a vendor is also a customer). Storing roles as columns on `profiles` would be a 1NF violation.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. |
| `role` | Enum: `admin`, `vendor`, `customer`. One role per row allows multiple roles per user. |
| `created_at` | Audit when the role was assigned. |

---

### `addresses`
**Purpose:** Stores all physical delivery/billing addresses for users in a normalized, reusable format.
**Why separate from `profiles`?** A user can have many saved addresses (Home, Office, etc.). Storing these as columns on `profiles` would be a 1NF violation. Using this table also lets `orders` reference a saved address via a FK instead of duplicating the raw text.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. This address belongs to this user. |
| `full_name` | Name of the recipient at this address (may differ from the account holder). |
| `phone` | Contact for the delivery rider at this specific address. |
| `street` | House/building number and street name. |
| `barangay` | Philippine-specific address subdivision. |
| `city` | City/municipality. |
| `province` | Province. |
| `zip_code` | Postal code for routing. |
| `label` | User-defined tag: "Home", "Office", etc. |
| `is_default` | Boolean flag — which address to auto-select at checkout. |
| `created_at` | Audit when address was saved. |

---

## GROUP 2: BRAND & VENDOR MANAGEMENT

### `brands`
**Purpose:** Represents a vendor's store on the platform. This is the Vendor subtype of `auth.users`.
**Constraint: 1 brand per user is enforced via `UNIQUE(owner_id)`.**
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `owner_id` | FK → `auth.users.id`. UNIQUE constraint enforces the 1 vendor = 1 brand rule. |
| `name` | The public store name shown to customers. |
| `slug` | URL-safe version of name (e.g., `"ni-mana-crafts"`). Used in brand profile URLs. |
| `description` | Store bio shown on the vendor profile page. |
| `logo_url` | Store logo image URL in Supabase Storage. |
| `banner_url` | Store cover/header image URL. |
| `location` | The vendor's general location (used for shipping calculations). |
| `status` | Enum: `pending`, `approved`, `verified`, `suspended`. Controls store visibility. |
| `shipping_base_fee` | **Website Usage:** When a buyer adds an item to their cart, this is the starting flat rate delivery fee for that specific store (e.g., ₱50 minimum shipping). |
| `shipping_per_item_fee` | **Website Usage:** The extra fee added for every additional item the buyer adds to the cart from the same store (e.g., +₱10 per shirt). Calculated live on the Checkout page. |
| `store_sale_percent` | If the vendor is running a sitewide store discount, the % is stored here. |
| `store_sale_ends_at` | Timestamp when the sitewide store sale ends. |
| `created_at` | When the brand was registered. |
| `updated_at` | When the brand info was last updated. |
| `deleted_at` | Soft delete flag. Store is hidden when non-null but data is preserved. |

> **Why no `rating` or `review_count` here?** These were REMOVED because they were cached aggregate values — an update anomaly waiting to happen. These are now calculated dynamically in the `brand_aggregates` VIEW.

---

### `brand_aggregates` (VIEW — not a table)
**Purpose:** A dynamic SQL view that always calculates the real-time rating and review count for each brand directly from the `reviews` table.
**Why a VIEW and not a column?** Storing `rating` and `review_count` directly on `brands` means we must manually update those numbers every time a review is added, edited, or deleted. If we forget, the numbers become wrong (update anomaly). The view calculates the truth on demand, every time.
| Column | Why It Exists |
|--------|--------------|
| `brand_id` | References the brand this aggregate belongs to. |
| `average_rating` | Computed live from all visible reviews for this brand. |
| `review_count` | Computed live. Never stale. |

---

### `vendor_applications`
**Purpose:** Captures a user's application to become a vendor before their brand is created.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. Who is applying. |
| `business_name` | The proposed store name. |
| `business_type` | Enum: `established` or `aspiring`. Affects review criteria. |
| `location` | Where the business operates. |
| `description` | What they sell / their business pitch. |
| `contact_phone` | Business contact separate from personal phone. |
| `valid_id_url` | Government ID uploaded to Supabase Storage. |
| `business_permit_url` | Business permit document URL. |
| `proof_of_products_url` | Photos of actual products they intend to sell. |
| `status` | Enum: `pending`, `approved`, `needs_resubmission`, `rejected`. |
| `admin_notes` | Admin feedback shown to the applicant. |
| `created_at` | When the application was submitted. |
| `updated_at` | When admin last reviewed it. |

---

### `vendor_verifications`
**Purpose:** Stores the formal legal document submission for full verification (BIR, DTI, Mayor's Permit). Separate from `vendor_applications` because this is a DIFFERENT process triggered AFTER a brand is already approved.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `brand_id` | FK → `brands.id`. Which store is being verified. |
| `bir_certificate_url` | BIR registration document URL. |
| `dti_registration_url` | DTI certificate URL. |
| `mayor_permit_url` | Mayor's permit URL. |
| `admin_notes` | Admin feedback on the verification. |
| `status` | Enum: `pending`, `verified`, `needs_resubmission`, `rejected`. |
| `submitted_at` | When documents were uploaded. |
| `reviewed_at` | When admin reviewed them. |

> **Why no `additional_docs[]` array?** It was an array — a 1NF violation. Now handled by `vendor_additional_docs`.

---

### `vendor_additional_docs`
**Purpose:** Junction table holding any extra documents submitted alongside a vendor verification. 
**Website Usage/Why It Exists:** Sometimes standard BIR/DTI papers aren't enough, and admins request extra proof (like a bank statement or a selfie with an ID). When the vendor goes to their "Verification Settings" page and uploads multiple miscellaneous files, they are saved here as individual rows. This table physically replaces the old `additional_docs[]` array which was an automatic 1NF violation.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `verification_id` | FK → `vendor_verifications.id`. Which verification this doc belongs to. |
| `doc_url` | URL of the uploaded supplementary document. |
| `created_at` | When this document was uploaded. |

---

## GROUP 3: PRODUCT CATALOG

### `categories`
**Purpose:** A centralized taxonomy of product categories so vendors cannot invent arbitrary category names.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `name` | The displayed category name: "Food", "Clothing", etc. |
| `slug` | URL-safe version for filtering/routing. |
| `image_url` | Banner image shown on category listing page. |
| `created_at` | When the category was created. |

---

### `products`
**Purpose:** The Supertype entity representing a product listing. Holds all generic product metadata.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `brand_id` | FK → `brands.id`. Which store sells this. |
| `category_id` | FK → `categories.id`. Categorizes the product. |
| `name` | The product name shown to customers. |
| `slug` | URL-safe product identifier for product page routing. |
| `description` | Full product description. |
| `price` | Current selling price. |
| `original_price` | The price before any discount (used for showing % off). |
| `preorder_discount_percent` | Special discount only valid during preorder window. |
| `listing_type` | Distinguishes `standard` vs `preorder` listings. |
| `release_date` | For preorders, when the product will ship. |
| `image_url` | The single primary thumbnail image of the product. |
| `in_stock` | Quick boolean for "Available" badge without querying all variants. |
| `is_active` | Whether the listing is publicly visible. |
| `created_at` | When listed. |
| `updated_at` | When last edited. |
| `deleted_at` | Soft delete — hides product but preserves order history integrity. |

> **Why no `sizes[]`, `images[]`, `stock_quantity`?** Arrays = 1NF violation. Stock per size was impossible to track. All three replaced by `product_variants` and `product_images`.

---

### `product_variants`
**Purpose:** Subtype of `products`. Each row is one specific SKU (e.g., "Blue Shirt, Size M"). Holds the per-size stock count. This is the direct fix to the professor's inventory tracking critique.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. This is the actual item added to a cart. |
| `product_id` | FK → `products.id`. Which product this variant belongs to. |
| `size` | The size label: "S", "M", "L", "XL", "Free Size", etc. |
| `stock_quantity` | The exact number of units available for THIS size specifically. |
| `created_at` | When this variant was defined. |

---

### `product_images`
**Purpose:** Junction table linking products to their gallery images. Replaces the `images[]` array.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `product_id` | FK → `products.id`. |
| `image_url` | A single image URL for this product. |
| `sort_order` | Integer controlling display order in the gallery. |
| `created_at` | When uploaded. |

---

## GROUP 4: CART & WISHLIST

### `carts`
**Purpose:** The parent container entity for a user's active shopping session. Added because the professor specifically noted `cart_items` had no governing parent entity.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. UNIQUE — one cart per user enforced. |
| `created_at` | When the cart was created. |
| `updated_at` | When last modified (item added/removed). |

---

### `cart_items`
**Purpose:** Junction table linking a user's cart to a specific product variant with a quantity.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `cart_id` | FK → `carts.id`. Which cart this item belongs to. |
| `variant_id` | FK → `product_variants.id`. The EXACT size and product selected. |
| `quantity` | How many units the user wants to buy. |
| `created_at` | When added to cart. |
| `updated_at` | When quantity was last changed. |

> **Why no `size` or `product_id` columns?** Both are derivable from `variant_id`. Storing them again would violate 2NF — they're non-key attributes that depend on `variant_id`, not on the cart item row itself.

---

### `wishlists`
**Purpose:** Tracks which products a user has favorited/saved for later.
**Deletion Strategy: Hard Delete.** When a user clicks the heart icon to un-favorite, the row is permanently deleted. No soft delete needed — there's no audit requirement for unfavorites.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. |
| `product_id` | FK → `products.id`. The product being wishlisted. |
| `created_at` | When added to wishlist. |

---

## GROUP 5: ORDER FULFILLMENT

### `orders`
**Purpose:** Represents a single checkout event. The master parent record created when a customer completes checkout. One order can contain items from multiple brands.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `customer_id` | FK → `auth.users.id`. Who placed the order. |
| `shipping_address_id` | FK → `addresses.id`. The selected delivery address (normalized — no raw text). |
| `discount_id` | FK → `discounts.id`. Platform-wide promo applied to this whole order. |
| `shipping_name` | Snapshot of recipient name at checkout time (in case address changes later). |
| `shipping_phone` | Snapshot of recipient phone at checkout time. |
| `total_amount` | Final amount charged to the customer after discounts. |
| `total_discount` | How much was discounted across the whole order. |
| `total_shipping` | Total shipping fees across all vendor sub-orders. |
| `notes` | Optional instructions from the customer to vendors. |
| `created_at` | Checkout timestamp. |
| `updated_at` | When the order record was last modified. |

---

### `vendor_orders`
**Purpose:** When an order contains products from 3 different brands, it splits into 3 vendor_orders — one per brand. Each vendor manages their own fulfillment workflow.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `order_id` | FK → `orders.id`. The parent master order. |
| `brand_id` | FK → `brands.id`. Which vendor is responsible for this sub-order. |
| `discount_id` | FK → `discounts.id`. Vendor-specific voucher applied to this sub-order only. |
| `status` | Enum tracking fulfillment state (pending → paid → processing → shipped → delivered). |
| `subtotal` | Total cost of just this brand's items, before shipping/discount. |
| `shipping_fee` | Shipping fee charged by this specific vendor. |
| `shipping_fee_original` | Original fee before any free-shipping discount (audit trail). |
| `discount_amount` | The monetary discount applied to this sub-order. |
| `free_shipping_applied` | Boolean marker for when a free-shipping promo was applied. |
| `auto_delivery_eligible` | **Website Usage:** In e-commerce (like Shopee), if a package arrives but the buyer forgets to click "Order Received", the system automatically marks it complete after 3 days and pays the vendor. This boolean flags if the sub-order is eligible for that automatic cron-job process. |
| `tracking_number` | Courier tracking code entered by the vendor. |
| `confirmed_at` | When vendor confirmed payment. |
| `shipped_at` | When vendor handed off to courier. |
| `handed_to_courier_at` | When courier received. |
| `for_delivery_at` | When courier started delivery. |
| `delivered_at` | When customer received. |
| `created_at` | When this sub-order was generated. |
| `updated_at` | Last status change time. |

> **Why are there so many timestamp columns?** Each timestamp marks a distinct, irreversible, auditable event in the delivery lifecycle. They are not redundant — they are a status history in column form and are critical for dispute resolution.

---

### `order_items`
**Purpose:** A permanent snapshot of what was purchased inside each `vendor_order`. Price is snapshotted here to protect historical accuracy.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `vendor_order_id` | FK → `vendor_orders.id`. |
| `product_id` | FK → `products.id` (nullable — product may be soft deleted later). |
| `product_name` | **Snapshot** of product name at time of purchase. Critical for historical accuracy. |
| `product_price` | **Snapshot** of price at time of purchase. Prevents price changes from corrupting old receipts. |
| `quantity` | How many units of this item were ordered. |
| `size` | **Snapshot** of size selected at time of purchase. Historical record. |
| `created_at` | When this line item was recorded. |

> **Why snapshot `product_name`, `product_price`, `size`?** If a vendor deletes a product or changes its price after an order, the receipt should still show the original values. This is standard financial data integrity.

---

## GROUP 6: PAYMENTS (DISJOINT SUPERTYPE/SUBTYPE)

### `payments` (Supertype)
**Purpose:** Records the payment transaction for an order. Uses an integer instead of a string for payment method to save bits and prevent typos.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `order_id` | FK → `orders.id`. Which order this payment is for. |
| `payment_method` | **smallint** — 0=COD, 1=GCash, 2=Bank Transfer. Integer saves storage vs string. |
| `amount` | The exact amount the customer paid. |
| `status` | `pending`, `verified`, `failed`. |
| `created_at` | When payment record was created. |

### `payment_verifications` (Disjoint Subtype — GCash & Bank only)
**Purpose:** Extra data required ONLY for digital payments (GCash=1, Bank=2). COD (0) never needs this. This is the disjoint subtype your professor requested.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `payment_id` | FK → `payments.id`. Which payment this verifies. |
| `proof_image_url` | Screenshot of the GCash/bank receipt uploaded by customer. |
| `reference_number` | The GCash or bank reference code. |
| `verified_at` | When admin confirmed the payment is real. |
| `created_at` | When proof was submitted. |

---

## GROUP 7: DISCOUNTS (DISJOINT SUPERTYPE/SUBTYPE)

### `discounts` (Supertype)
**Purpose:** The single source of truth for ALL discount logic. Replaces both the old `promotions` and `vouchers` tables which were doing the same job redundantly.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `name` | The public name of this discount. |
| `description` | What the discount is about. |
| `discount_type` | `percentage`, `fixed`, `free_shipping` — the math type. |
| `discount_value` | The number applied (e.g., 20 for 20% off, or 50 for ₱50 off). |
| `min_order_amount` | Minimum cart total to qualify for this discount. |
| `max_discount_amount` | Cap on how much can be discounted (prevents 100% off abuse). |
| `max_uses` | Total times this discount can be used across all users. |
| `max_uses_per_user` | Per-user limit to prevent one person using it 1000 times. |
| `current_uses` | Running counter of how many times it has been used. |
| `is_stackable` | Whether this can be combined with other discounts. |
| `starts_at` | When the discount becomes active. |
| `ends_at` | When it expires. |
| `is_active` | Manual on/off toggle. |
| `created_at` | When created. |
| `updated_at` | When last modified. |

### `platform_promos` (Disjoint Subtype A — Admin only)
**Purpose:** Specific metadata for system-wide promotions created by platform admins. An entity here means this discount is platform-managed.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `discount_id` | FK → `discounts.id`. UNIQUE — a discount can only be one subtype. |
| `code` | Optional promo code customers type at checkout. |
| `scope` | `platform` (sitewide), `category`, or `product` — what it applies to. |
| `deployment_target` | If scoped, which category/product it targets. |
| `created_by` | FK → `auth.users.id`. Which admin created this. |

### `vendor_vouchers` (Disjoint Subtype B — Vendor only)
**Purpose:** Specific metadata for discounts created by vendors for their own stores. An entity here means this discount is vendor-managed.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `discount_id` | FK → `discounts.id`. UNIQUE — a discount can only be one subtype. |
| `brand_id` | FK → `brands.id`. Which vendor created this voucher. |
| `code` | A code the customer can enter at checkout. |
| `source` | `vendor_created` or `lucky_promo` — how the voucher was generated. |
| `target_audience` | `all` or `new_customers` etc. |

> **Why did we delete `promotions` and `vouchers` tables?** They both stored discount math (value, min amount, uses) — this was direct data redundancy. The `discounts` supertype eliminates that by owning all shared math in one place.

---

## GROUP 8: LUCKY PROMO

### `lucky_promo_settings`
**Purpose:** A single-row configuration table that controls how the Lucky Promo spinner feature works site-wide.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK (only one row should ever exist). |
| `updated_by` | FK → `auth.users.id`. Which admin last changed settings. |
| `is_active` | Master on/off switch for the feature. |
| `daily_claim_limit` | Max total promo claims per day (prevents abuse). |
| `probability_percent` | Chance of winning per spin. |
| `min_discount`, `max_discount` | Range of discount values to randomly award. |
| `shipping_voucher_amount` | Fixed ₱ value of the shipping voucher prize. |
| `shipping_voucher_chance` | Probability of winning a free shipping voucher specifically. |
| `active_hours_start`, `active_hours_end` | Time window when spinning is allowed. |
| `updated_at` | Last modified timestamp. |

### `lucky_promo_claims`
**Purpose:** Records each time a user claims a Lucky Promo reward, to prevent duplicate claims per day.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. Who claimed. |
| `discount_id` | FK → `discounts.id`. Which discount was awarded. |
| `claimed_date` | The calendar date (not timestamp) — used to enforce 1-claim-per-day rule. |
| `created_at` | Exact timestamp of the claim. |

---

## GROUP 9: LOYALTY

### `loyalty_progress`
**Purpose:** Tracks each user's progress toward earning milestone rewards.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. |
| `total_delivered_orders` | Count of successfully delivered orders. Triggers milestones. |
| `milestone_5_deliveries_claimed` | Boolean — prevents the "5 deliveries" reward from being claimed twice. |
| `milestone_10_sellers_claimed` | Boolean — prevents the "10 unique sellers" reward from being claimed twice. |
| `updated_at` | When progress was last recalculated. |

### `user_purchased_sellers`
**Purpose:** Junction table tracking which unique brands a user has bought from. Replaces the `unique_sellers_purchased[]` array. Used for the "buy from 10 different sellers" milestone.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `loyalty_id` | FK → `loyalty_progress.id`. |
| `brand_id` | FK → `brands.id`. A seller this user has purchased from. |
| `UNIQUE(loyalty_id, brand_id)` | Prevents counting the same seller twice. |

---

## GROUP 10: MESSAGING & DISPUTES

### `messages`
**Purpose:** The live chat system between buyers and vendors, always tied to a specific order context for accountability.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `vendor_order_id` | FK → `vendor_orders.id`. Scopes the conversation to a specific order. |
| `sender_id` | FK → `auth.users.id`. Who sent the message. |
| `receiver_id` | FK → `auth.users.id`. Who should receive it. |
| `content` | The actual message text. |
| `is_system_message` | Boolean — system-generated messages (e.g., "Order status changed"). |
| `attachment_url` | Optional file attachment URL. |
| `attachment_name` | Display name of the attachment. |
| `attachment_type` | MIME type of the attachment. |
| `read_at` | When receiver read the message (for read receipts). |
| `created_at` | When sent. |

### `disputes`
**Purpose:** A formal contention record when a buyer has a problem with an order (wrong item, damaged, not received).
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `vendor_order_id` | FK → `vendor_orders.id`. Which specific sub-order is disputed. |
| `customer_id` | FK → `auth.users.id`. The buyer filing the dispute. |
| `vendor_id` | FK → `auth.users.id`. The seller being disputed against. |
| `resolved_by` | FK → `auth.users.id`. Which admin resolved it. |
| `reason` | Short category of the problem ("Wrong item", "Missing item", etc.). |
| `description` | Full narrative from the buyer explaining the issue. |
| `refund_amount` | How much was refunded if resolved in buyer's favor. |
| `resolution_notes` | Admin's written resolution verdict. |
| `status` | Enum: `pending`, `under_review`, `resolved_refund`, `escalated`, etc. |
| `resolved_at` | When the case was closed. |
| `created_at`, `updated_at` | Audit timestamps. |

### `dispute_evidence`
**Purpose:** Junction table for uploaded proof images related to a dispute. Replaces `evidence_urls[]` array.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `dispute_id` | FK → `disputes.id`. |
| `evidence_url` | URL of a single uploaded photo/video. |
| `created_at` | When uploaded. |

---

## GROUP 11: REVIEWS & REPORTS

### `reviews`
**Purpose:** Verified purchase reviews submitted by buyers after successful delivery. Tied to a specific vendor_order to ensure only real buyers can review.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `user_id` | FK → `auth.users.id`. Who wrote the review. |
| `product_id` | FK → `products.id`. What product the review is about. |
| `brand_id` | FK → `brands.id`. Feeds into the brand's aggregate rating. |
| `vendor_order_id` | FK → `vendor_orders.id`. Proves the reviewer actually bought the product. |
| `rating` | Numeric 1–5 star rating. |
| `comment` | Written feedback. |
| `is_visible` | Admin can hide violating reviews without deleting them. |
| `created_at` | When submitted. |

### `review_media`
**Purpose:** Junction table for photos/videos attached to a review. Replaces `media_urls[]` array.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `review_id` | FK → `reviews.id`. |
| `media_url` | URL of a single photo/video. |
| `created_at` | When uploaded. |

### `reports`
**Purpose:** Allows users and vendors to flag inappropriate reviews, products, or brands for admin moderation.
| Column | Why It Exists |
|--------|--------------|
| `id` | UUID PK. |
| `reporter_id` | FK → `auth.users.id`. Who filed the report. |
| `review_id` | FK → `reviews.id` (nullable — only set if reporting a review). |
| `product_id` | FK → `products.id` (nullable — only set if reporting a product). |
| `brand_id` | FK → `brands.id` (nullable — only set if reporting a brand). |
| `reason` | Why it was reported. |
| `admin_notes` | Admin's action notes. |
| `status` | `pending`, `reviewed`, `resolved`. |
| `resolved_at` | When admin closed the report. |
| `created_at` | When filed. |

> **Why are `review_id`, `product_id`, `brand_id` all nullable?** A report is always about exactly ONE of these targets. The nullable FKs allow the same table to handle all three report types (polymorphic association) without creating three separate redundant report tables.

---

## Summary: Why Every Structural Decision Is Sound

| Design Decision | Normalization Principle | Result |
|---|---|---|
| Arrays replaced with junction tables | 1NF — Atomic values only | No array violations |
| `email` only in `auth.users` | 3NF — No transitive dependencies | Single source of truth |
| `rating/review_count` removed from `brands` | 3NF — No update anomalies | Dynamic view calculates live |
| `addresses` table, FK from `orders` | 2NF — No partial dependencies | No raw text duplication |
| `products/product_variants` split | 1NF + Inventory accuracy | Per-size stock tracking |
| `discounts` supertype replaces `promotions`+`vouchers` | 2NF — Eliminate redundancy | One discount system |
| `payments`/`payment_verifications` disjoint | Supertype/Subtype modeling | COD needs no verification row |
| `carts` parent for `cart_items` | Entity integrity | Governed cart hierarchy |
| `UNIQUE(owner_id)` on `brands` | Referential integrity constraint | 1 vendor = 1 brand enforced |
