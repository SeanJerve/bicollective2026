# Bicollective — Multi-Vendor Marketplace

A modern multi-vendor e-commerce marketplace built for Bicolano clothing brands using **React**, **TypeScript**, **Tailwind CSS**, and **Supabase** (via Lovable Cloud).

---

## Table of Contents

1. [Features](#features)
2. [Test Accounts](#test-accounts)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Local Development](#local-development)
6. [Environment Variables](#environment-variables)
7. [Key Workflows](#key-workflows)
8. [Security Notes](#security-notes)
9. [Deployment](#deployment)

---

## Features

| Area | Description |
|------|-------------|
| **Public Marketplace** | Browse products, brands, and categories with location-aware search |
| **Autocomplete Search** | Search products, brands, and locations globally from the header |
| **Location Filtering** | Filter products and brands by Bicol city/province |
| **User Authentication** | Email/password + Google Sign-In (auto-confirm enabled for testing) |
| **Customer Orders** | View order history and tracking numbers at `/account/orders` |
| **Vendor Dashboard** | Create products, upload images, manage inventory, view orders |
| **Admin Panel** | Manage vendors, view reports (separate from vendor access) |
| **Role-Based Access** | Admins, vendors, and customers have isolated routes/permissions |
| **Neo-Brutalist Design** | Bold, high-contrast UI with full mobile responsiveness |

---

## Test Accounts

All accounts use auto-confirm email signup for faster testing.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bicollective.test` | `admin123` |
| Vendor | `testvendor@bicollective.test` | `password123` |
| Customer | `customer@bicollective.test` | `customer123` |

> **Note**: Admins can access the Admin Panel but **cannot** access the Vendor Dashboard or create their own store. Vendors cannot access the Admin Panel.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query (React Query)
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Routing**: React Router v6

---

## Project Structure

```
src/
├── assets/            # Static images (hero, products, brands)
├── components/
│   ├── layout/        # Header, Footer, PageLayout, SearchAutocomplete
│   ├── marketplace/   # ProductCard, BrandCard, CategoryCard
│   ├── vendor/        # ProductForm
│   ├── auth/          # TestAccountsBox
│   └── ui/            # shadcn components
├── contexts/          # AuthContext, CartContext
├── hooks/             # useProducts, useCart, etc.
├── integrations/      # Supabase client + types
├── pages/
│   ├── account/       # Orders, OrderDetail
│   ├── admin/         # AdminDashboard, AdminVendors, AdminReports
│   ├── auth/          # Login, Register
│   └── vendor/        # VendorDashboard, VendorProducts, VendorOrders, VendorStore
└── App.tsx            # Route definitions
```

---

## Local Development

### Prerequisites

- **Node.js** 18+ and **npm** (or use **bun** for faster installs)
- Git

### Steps

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install
# or
bun install

# 3. Create a .env file (see Environment Variables below)
cp .env.example .env

# 4. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> In Lovable Cloud projects, these are auto-generated. For standalone Supabase projects, copy them from your Supabase dashboard → Settings → API.

---

## Key Workflows

### Customer Flow

1. Browse products or use the autocomplete search bar
2. Filter by category, brand, or location
3. Add items to cart, proceed to checkout (requires login)
4. View order history at `/account/orders`
5. Track order status and tracking numbers

### Vendor Flow

1. Sign up as a new user (or use test vendor account)
2. Navigate to `/vendor/store` to create a store (requires location)
3. Once the store is created, the user gains the `vendor` role
4. Add products via `/vendor/products`, upload images
5. View and update orders at `/vendor/orders`

### Admin Flow

1. Log in with admin credentials
2. Access `/admin` for vendor management and reports
3. Admins cannot create stores or access vendor dashboard

---

## Security Notes

- **Row-Level Security (RLS)** is enabled on all tables
- Roles are stored in a separate `user_roles` table (not in profiles)
- Admin checks use a `has_role()` database function to prevent privilege escalation
- Storage buckets have RLS policies:
  - `product-images` & `brand-assets`: public read, vendor write
  - `payment-proofs`: restricted to customer/vendor/admin
- Google OAuth is managed via Lovable Cloud
- **Leaked password protection** should be enabled in Supabase Auth settings

---

## Deployment

### Via Lovable

Click **Publish** in the Lovable editor to deploy instantly.

### Custom Domain

1. Go to Project → Settings → Domains
2. Add your custom domain and configure DNS as instructed

### Self-Hosting

Follow the [Lovable self-hosting guide](https://docs.lovable.dev/tips-tricks/self-hosting) for manual deployment.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.
