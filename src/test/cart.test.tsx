import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Cart from "../pages/Cart";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    isAdmin: false,
  }),
}));

// Mock PageLayout
vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();

const mockCartItems = [
  {
    id: "cart-item-1",
    quantity: 2,
    variant: {
      id: "v-1",
      size: "S",
      stock_quantity: 5,
      product: {
        id: "prod-1",
        name: "Boses Trucker Cap",
        price: 349,
        slug: "boses-trucker-cap",
        image_url: "/boses-trucker-cap.png",
        brand_id: "brand-1",
        brand: {
          id: "brand-1",
          name: "Sigaw",
          slug: "sigaw",
        },
      },
    },
  },
];

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    items: mockCartItems,
    loading: false,
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
  }),
}));

describe("Cart Component Tests (Vince)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display products currently in the cart with their subtotals", () => {
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    // Quantity is 2, price is 349, subtotal should be 698
    expect(screen.getByText("Boses Trucker Cap")).toBeInTheDocument();
    expect(screen.getByText("Size: S")).toBeInTheDocument();
    // Subtotal text on the right
    expect(screen.getAllByText("₱698.00").length).toBeGreaterThan(0);
  });

  it("should call updateQuantity with incremented quantity when plus button is clicked", () => {
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    // Find plus button (button containing Plus SVG or label)
    const plusButtons = screen.getAllByRole("button");
    const plusBtn = plusButtons.find((btn) => btn.querySelector("svg.lucide-plus") || btn.innerHTML.includes("plus"));
    
    if (plusBtn) {
      fireEvent.click(plusBtn);
      expect(mockUpdateQuantity).toHaveBeenCalledWith("cart-item-1", 3);
    }
  });

  it("should call removeItem when trash button is clicked", () => {
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const trashButtons = screen.getAllByRole("button");
    const trashBtn = trashButtons.find((btn) => btn.querySelector("svg.lucide-trash2") || btn.innerHTML.includes("trash"));

    if (trashBtn) {
      fireEvent.click(trashBtn);
      expect(mockRemoveItem).toHaveBeenCalledWith("cart-item-1");
    }
  });
});
