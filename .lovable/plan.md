

# Plan: Buy Now Direct Checkout + Multi-Address System

## 1. Buy Now — Direct Checkout (Skip Cart)

**Problem**: Current plan adds item to cart then navigates to checkout, which would include all existing cart items alongside the "Buy Now" item.

**Solution**: Use React Router navigation state to pass a "buy now" item directly to checkout without touching the cart.

### Changes:
- **`ProductDetail.tsx`**: Add "Buy Now" button. On click, navigate to `/checkout` with `location.state = { buyNowItem: { product_id, quantity, size, product } }`.
- **`Checkout.tsx`**: Check `location.state?.buyNowItem`. If present, use ONLY that item for checkout (ignore cart items). After order placement, do NOT clear the cart (cart remains untouched). Show a "Back to Product" link instead of "Continue Shopping" if in buy-now mode.
- **`CartContext.tsx`**: No changes needed — buy now bypasses the cart entirely.

### Flow:
```text
ProductDetail → Click "Buy Now"
    → navigate("/checkout", { state: { buyNowItem: {...} } })
    → Checkout reads state, uses single item only
    → Order placed → cart untouched
```

---

## 2. Multi-Address System

### Database:
- Create `addresses` table: `id`, `user_id`, `label`, `full_name`, `phone`, `street`, `barangay`, `city`, `province`, `zip_code`, `is_default`, `created_at`
- RLS: users manage their own addresses
- When setting a new default, unset previous defaults via a trigger or in application code

### New Files:
- **`src/pages/account/AddAddress.tsx`**: Form page with text inputs for street/barangay, dropdowns for Province (Bicol provinces), City (filtered by province), Zip Code. Accepts `?returnTo=/checkout` query param so after saving, user is redirected back.
- **`src/pages/account/Addresses.tsx`** (optional, or inline in Profile): List saved addresses with default badge, edit, delete actions.

### Modified Files:
- **`Profile.tsx`**: Replace single address text input with address collection UI — list of saved addresses, "Add Address" button, set default, delete.
- **`Checkout.tsx`**: 
  - On mount, fetch user's addresses. If none exist, redirect to `/account/add-address?returnTo=/checkout`.
  - Show address selector dropdown pre-filled with default address.
  - Remove manual fullName/phone/address text inputs; pull from selected address.
- **`App.tsx`**: Add routes for `/account/add-address` and optionally `/account/addresses`.

### Philippine Geography Data:
- Hardcode Bicol region provinces: Albay, Camarines Norte, Camarines Sur, Catanduanes, Masbate, Sorsogon
- Hardcode major cities per province and corresponding zip codes as static data in a constants file

### Checkout → Add Address → Return Flow:
```text
Checkout loads → fetch addresses → 0 results
    → navigate("/account/add-address?returnTo=/checkout")
    → User fills form, saves
    → navigate(returnTo) → back to /checkout
    → Address selector now shows the new address
```

---

## Summary of File Changes

| File | Action |
|------|--------|
| `src/pages/ProductDetail.tsx` | Add "Buy Now" button with navigate state |
| `src/pages/Checkout.tsx` | Handle buyNowItem state; replace address form with address selector; redirect if no addresses |
| `src/pages/account/Profile.tsx` | Replace address input with address collection UI |
| `src/pages/account/AddAddress.tsx` | New — address form with province/city/zip dropdowns |
| `src/App.tsx` | Add new route |
| `src/data/bicolGeo.ts` | New — Philippine Bicol region geography constants |
| Migration SQL | Create `addresses` table + RLS |

