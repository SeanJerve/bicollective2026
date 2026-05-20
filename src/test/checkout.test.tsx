import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Checkout from "../pages/Checkout";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock router hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      state: null,
    }),
  };
});

// Mock PageLayout
vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

// Mock Toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock useAuth
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "customer-1" },
    isAdmin: false,
  }),
}));

// Mock useCart
vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    items: [
      {
        id: "cart-item-1",
        quantity: 1,
        variant_id: "v-1",
        variant: {
          id: "v-1",
          size: "S",
          product: {
            id: "p-1",
            name: "Boses Trucker Cap",
            price: 349,
            brand_id: "brand-1",
            brand: { id: "brand-1", name: "Sigaw", location: "Naga City" },
          },
        },
      },
    ],
    total: 349,
    clearCart: vi.fn(),
  }),
}));

const mockAddresses = [
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

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "user-addresses") {
      return { data: mockAddresses, isLoading: false };
    }
    return { data: [], isLoading: false };
  },
}));

describe("Checkout Component Tests (Lloyd)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show default delivery address information", async () => {
    render(
      <BrowserRouter>
        <Checkout />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Lloyd Test")).toBeInTheDocument();
      expect(screen.getByText(/123 Main St, Bitano, Legazpi City, Albay 4500/i)).toBeInTheDocument();
    });
  });

  it("should disable the Place Order button when payment method is GCash and no file is uploaded", async () => {
    render(
      <BrowserRouter>
        <Checkout />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Lloyd Test")).toBeInTheDocument();
    });

    // Select GCash payment method
    const gcashRadio = screen.getByLabelText(/GCash/i);
    fireEvent.click(gcashRadio);

    // Verify Place Order button is disabled
    const placeOrderBtn = screen.getByRole("button", { name: /Place Order/i });
    expect(placeOrderBtn).toBeDisabled();
  });
});
