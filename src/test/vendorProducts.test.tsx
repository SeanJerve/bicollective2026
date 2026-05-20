import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VendorProducts from "../pages/vendor/VendorProducts";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Stable mock object to prevent React dependency comparison infinite loop
const stableUser = { id: "vendor-1" };

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: stableUser,
  }),
}));

// Mock ProductForm
vi.mock("@/components/vendor/ProductForm", () => ({
  default: ({ onCancel }: any) => (
    <div data-testid="product-form">
      <h2>Add Product Form</h2>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe("VendorProducts Component Tests (Jerve)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load store brand data and render product table", async () => {
    render(
      <BrowserRouter>
        <VendorProducts />
      </BrowserRouter>
    );

    // Wait for supabase mocks to resolve and render
    await waitFor(() => {
      expect(screen.getByText("Products")).toBeInTheDocument();
      // Should show the mock product name in at least one view (desktop/mobile)
      expect(screen.getAllByText("Boses Trucker Cap").length).toBeGreaterThan(0);
    });
  });

  it("should show Add Product Form when add product button is clicked", async () => {
    render(
      <BrowserRouter>
        <VendorProducts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Boses Trucker Cap").length).toBeGreaterThan(0);
    });

    const addProductBtn = screen.getByRole("button", { name: /Add Product/i });
    fireEvent.click(addProductBtn);

    // Form heading should appear
    expect(screen.getByTestId("product-form")).toBeInTheDocument();
    expect(screen.getByText("Add Product Form")).toBeInTheDocument();
  });
});
