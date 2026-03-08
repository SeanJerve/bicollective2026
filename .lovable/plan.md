

# Plan: Hide "Become a Vendor" for Vendors

## Changes

### 1. `Header.tsx`
Already handled in the dropdown for logged-in users (line 154: `!isVendor && !isAdmin` guard). No change needed there.

### 2. `Footer.tsx`
- Import `useAuth` and conditionally exclude "Become a Vendor" and "Vendor Login" links from the `forVendors` array when `isVendor` is true. Replace with "Vendor Dashboard" link instead.

### 3. `Index.tsx`
- Import `useAuth` and wrap the entire CTA section ("Own a Local Brand?") in a conditional that only renders when `isVendor` is false.

Three files touched, minimal changes each.

