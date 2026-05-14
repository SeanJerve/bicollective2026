<div align="center">
  <img src="https://lovable.dev/opengraph-image-p98pqg.png" alt="Bicollective Cover Image" width="100%" />

# Bicollective — Multi-Vendor Marketplace 🛒✨

_A modern multi-vendor e-commerce marketplace built specifically for Bicolano clothing brands, empowering local communities through commerce._

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🔐 Test Accounts](#-test-accounts)
- [🚀 Local Development](#-local-development)
- [🌍 Key Workflows](#-key-workflows)
- [🛡️ Security Notes](#️-security-notes)
- [🌐 Deployment](#-deployment)

---

## ✨ Features

We deliver a robust, end-to-end multi-vendor experience with advanced state management and secure backends.

| Feature Area                | Description                                                                                            |
| :-------------------------- | :----------------------------------------------------------------------------------------------------- |
| 🛍️ **Public Marketplace**   | Browse products, brands, and categories with location-aware search capabilities.                       |
| 🔍 **Autocomplete Search**  | Global search across products, brands, and locations directly from the header.                         |
| 📍 **Location Filtering**   | Discover products and brands by specific Bicol city or province.                                       |
| 👤 **User Authentication**  | Email/password login and Google Sign-In (with auto-confirm enabled for rapid testing).                 |
| 📦 **Customer Orders**      | Track order history, delivery statuses, and tracking numbers seamlessly.                               |
| 🏪 **Vendor Dashboard**     | Complete store management: product creation, inventory tracking, image uploads, and order fulfillment. |
| ⚙️ **Admin Panel**          | Platform oversight: manage vendors, handle verifications, and view global reports.                     |
| 🔐 **Role-Based Access**    | Strictly isolated routing and database permissions for Admins, Vendors, and Customers.                 |
| 🎨 **Neo-Brutalist Design** | A bold, high-contrast, fully responsive UI designed to leave a lasting impression.                     |

---

## 🏗️ Tech Stack

Bicollective is built on a modern, high-performance web stack:

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, `shadcn/ui` components, Neo-Brutalist aesthetics
- **Data Fetching & State**: TanStack Query (React Query)
- **Backend & Database**: Supabase (PostgreSQL Database, Auth, Storage, Edge Functions)
- **Routing**: React Router v6

---

## 📂 Project Structure

A clean, modularized architecture designed for scalability:

```text
src/
├── assets/            # Static media (hero images, category banners)
├── components/        # Reusable React components
│   ├── layout/        # Global layout elements (Header, Footer, Navigation)
│   ├── marketplace/   # Product & Brand display cards
│   ├── vendor/        # Vendor-specific UI elements
│   ├── auth/          # Authentication flows
│   └── ui/            # Core shadcn/ui primitive components
├── contexts/          # Global React Contexts (Auth, Cart)
├── hooks/             # Custom React Hooks (useProducts, useCart)
├── integrations/      # Supabase client initialization & Database Types
└── pages/             # Route-level Page Components
    ├── account/       # Customer profile & orders
    ├── admin/         # Platform administration
    ├── auth/          # Login & registration forms
    └── vendor/        # Vendor management dashboards
```


## 🚀 Local Development

### Prerequisites

- Node.js 18+ and npm (or `bun` for faster dependency resolution)
- Git

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   _Required Variables:_

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   > App runs at `http://localhost:5173` by default.

---

## 🌍 Key Workflows

### 🛒 Customer Flow

1. Browse products or use the global autocomplete search.
2. Filter dynamically by category, brand, or location.
3. Add items to cart and proceed through a secure checkout process.
4. Track order fulfillment and shipping statuses via the Account portal.

### 🏪 Vendor Flow

1. Sign up and navigate to `/vendor/store` to register a location-aware brand.
2. Once approved, gain the `vendor` role permissions.
3. Create products, manage variant inventories, and upload product galleries.
4. Manage incoming orders, update shipping statuses, and input tracking numbers.

### 👑 Admin Flow

1. Access the dedicated `/admin` portal.
2. Review and approve/reject new vendor applications.
3. Monitor platform-wide dispute reports and financial analytics.

---

## 🛡️ Security Notes

Our database is rigorously secured using Supabase Row-Level Security (RLS).

- **Strict RLS Policies**: Enabled on all tables. Users can only access their own data.
- **Role Isolation**: Roles are securely stored in a `user_roles` table, preventing client-side manipulation.
- **Secure RPC Checks**: Administrative checks use `has_role()` database functions to prevent privilege escalation.
- **Storage Protection**:
  - `product-images` & `brand-assets`: Public read, Vendor-only write.
  - `payment-proofs`: Restricted exclusively to the associated Customer, Vendor, and Admins.

---

## 🌐 Deployment

### Custom Domain setup

1. Navigate to Project → Settings → Domains.
2. Add your custom domain and apply the provided DNS records.

---

<div align="center">
  <i>Developed for academic excellence in modern web development and relational database design.</i>
</div>
