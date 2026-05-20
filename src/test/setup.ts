import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Unified mock data for Supabase tables aligned with seeded Bicollective data
const getTableData = (table: string) => {
  if (table === "brands") {
    return {
      id: "brand-1",
      name: "Sigaw",
      owner_id: "vendor-1",
    };
  }
  if (table === "products") {
    return [
      {
        id: "prod-1",
        name: "Boses Trucker Cap",
        price: 349,
        category_id: "cat-1",
        category: { name: "Caps" },
        is_active: true,
        totalStock: 10,
        product_variants: [{ id: "v-1", size: "S", stock_quantity: 10 }],
        product_images: [],
      },
    ];
  }
  if (table === "categories") {
    return [{ id: "cat-1", name: "Caps" }];
  }
  if (table === "addresses") {
    return [
      {
        id: "addr-1",
        full_name: "Lloyd Test",
        phone: "09123456789",
        street: "123 Main St",
        barangay: "Bitano",
        city: "Legazpi City",
        province: "Albay",
        zip_code: "4500",
        is_default: true,
        label: "Home",
      },
    ];
  }
  return null;
};

// Generic chainable query builder
const createQueryBuilder = (tableName: string) => {
  const builder: any = {
    tableName,
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    in: () => builder,
    order: () => builder,
    maybeSingle: () => Promise.resolve({ data: getTableData(tableName), error: null }),
  };
  builder.then = (resolve: any) =>
    Promise.resolve({ data: getTableData(tableName), error: null }).then(resolve);
  return builder;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => createQueryBuilder(table),
  },
}));
