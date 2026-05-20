import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Products from "../pages/Products";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock Navigate, useSearchParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock PageLayout
vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

// Mock ProductCard
vi.mock("@/components/marketplace/ProductCard", () => ({
  default: (props: any) => (
    <div data-testid="product-card">
      <h3>{props.name}</h3>
      <span>{props.category}</span>
    </div>
  ),
}));

// Mock SEO hook
vi.mock("@/hooks/usePageSEO", () => ({
  default: () => {},
}));

const mockProducts = [
  {
    id: "prod-1",
    name: "Boses Trucker Cap",
    slug: "boses-trucker-cap",
    price: 349,
    image: "/boses-trucker-cap.png",
    brandName: "Sigaw",
    brandSlug: "sigaw",
    category: "Caps",
    categorySlug: "caps",
    inStock: true,
    listingType: "regular",
  },
  {
    id: "prod-2",
    name: "Signature Tee",
    slug: "signature-tee",
    price: 599,
    image: "/signature-tee.png",
    brandName: "Sigaw",
    brandSlug: "sigaw",
    category: "Apparel",
    categorySlug: "apparel",
    inStock: true,
    listingType: "regular",
  },
];

const mockBrands = [
  { id: "b-1", name: "Sigaw", slug: "sigaw", location: "Naga City", rating: 5, isVerified: true },
];

const mockCategories = [
  { id: "cat-1", name: "Caps", slug: "caps", productCount: 1 },
  { id: "cat-2", name: "Apparel", slug: "apparel", productCount: 1 },
];

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({ data: mockProducts, isLoading: false }),
  useBrands: () => ({ data: mockBrands, isLoading: false }),
  useCategories: () => ({ data: mockCategories, isLoading: false }),
}));

describe("Products Component Tests (Eljohn)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all products from mock data", () => {
    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    const productCards = screen.getAllByTestId("product-card");
    expect(productCards.length).toBe(2);
    expect(screen.getByText("Boses Trucker Cap")).toBeInTheDocument();
    expect(screen.getByText("Signature Tee")).toBeInTheDocument();
  });

  it("should filter products when a category is selected", () => {
    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    // Get the category buttons
    const capsButton = screen.getAllByRole("button", { name: "Caps" })[0];
    fireEvent.click(capsButton);

    // After filtering by Caps, only Boses Trucker Cap should remain
    const productCards = screen.getAllByTestId("product-card");
    expect(productCards.length).toBe(1);
    expect(screen.getByText("Boses Trucker Cap")).toBeInTheDocument();
    expect(screen.queryByText("Signature Tee")).not.toBeInTheDocument();
  });
});
