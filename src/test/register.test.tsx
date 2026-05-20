import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../pages/auth/Register";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock Navigate and Link
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock Toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock AuthContext
const mockSignUp = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    user: null,
  }),
}));

// Mock PageLayout
vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

// Mock AuthHeader
vi.mock("@/components/layout/AuthHeader", () => ({
  default: () => <div data-testid="auth-header" />,
}));

describe("Register Component Tests (Kiel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show validation toast error when passwords do not match", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText("Juan Dela Cruz");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const pwInputs = screen.getAllByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: "Kiel Test" } });
    fireEvent.change(emailInput, { target: { value: "kiel@test.com" } });
    fireEvent.change(pwInputs[0], { target: { value: "password123" } });
    fireEvent.change(pwInputs[1], { target: { value: "differentpw" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Passwords don't match",
          variant: "destructive",
        })
      );
    });
  });

  it("should validate that password is at least 6 characters", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText("Juan Dela Cruz");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const pwInputs = screen.getAllByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: "Kiel Test" } });
    fireEvent.change(emailInput, { target: { value: "kiel@test.com" } });
    fireEvent.change(pwInputs[0], { target: { value: "123" } });
    fireEvent.change(pwInputs[1], { target: { value: "123" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Password too short",
          variant: "destructive",
        })
      );
    });
  });
});
