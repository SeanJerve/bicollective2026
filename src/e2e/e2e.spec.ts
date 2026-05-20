import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Ensure screenshot directory exists
const screenshotDir = "C:/Users/seanjerve/OneDrive/Desktop/bicollective2026/ADET/screenshots";
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe("ADET E2E Testing Suite", () => {
  // Test 1: User Login & Session Management (Kiel)
  test("Test 1: User Login & Session Management (Kiel)", async ({ page }) => {
    // Go to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Capture the empty login form
    await page.screenshot({ path: path.join(screenshotDir, "kiel_login_form.png") });

    // Fill credentials
    await page.fill('input[type="email"]', "customer.juan@demo.com");
    await page.fill('input[type="password"]', "password123");

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for redirect to home page and look for session active indicator
    await page.waitForURL("**/");
    await page.waitForLoadState("networkidle");

    // Capture successful login screen (homepage with active session)
    await page.screenshot({ path: path.join(screenshotDir, "kiel_login_success.png") });

    // Expect to be on homepage (ending in /)
    await expect(page).toHaveURL(/.*\/$/);
  });

  // Test 4: Product Detail Interaction & Review Form (Eljohn)
  test("Test 4: Product Detail Interaction & Review Form (Eljohn)", async ({ page }) => {
    // Go to catalog
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Click on the first product card/link
    const productCard = page.locator(".card-brutal, a[href^='/products/']").first();
    await productCard.click();

    // Wait for details page to render completely (wait for Add to Cart button to be visible)
    const addToCartBtn = page.locator("button:has-text('Add to Cart'), button:has-text('Add To Cart')").first();
    await addToCartBtn.waitFor({ state: "visible" });

    // Wait for reviews loading state to resolve (reviews should render)
    await page.waitForTimeout(1000);

    // Capture product detail view
    await page.screenshot({ path: path.join(screenshotDir, "eljohn_product_detail.png") });

    // Assert product detail is displayed (heading is visible)
    const productTitle = page.locator("h1").first();
    await expect(productTitle).toBeVisible();
  });

  // Test 6: Add to Cart Flow (Vince)
  test("Test 6: Add to Cart Flow (Vince)", async ({ page }) => {
    // Log in first as customer so that the /cart page doesn't ask us to log in
    await page.goto("/login");
    await page.fill('input[type="email"]', "customer.juan@demo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");

    // Go to products page
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Click on the first product card
    const productCard = page.locator(".card-brutal, a[href^='/products/']").first();
    await productCard.click();

    // Wait for details page to render completely (wait for Add to Cart button to be visible)
    const addToCartBtn = page.locator("button:has-text('Add to Cart'), button:has-text('Add To Cart')").first();
    await addToCartBtn.waitFor({ state: "visible" });

    // Select size variant (click button with exact name "S", "M", or "L")
    let sizeButton = page.getByRole("button", { name: "S", exact: true });
    if (await sizeButton.count() === 0) {
      sizeButton = page.getByRole("button", { name: "M", exact: true });
    }
    if (await sizeButton.count() === 0) {
      sizeButton = page.getByRole("button", { name: "L", exact: true });
    }
    await sizeButton.first().click();

    // Click "Add to Cart" button now that variant size is selected
    await addToCartBtn.click();

    // Wait for item to be added and cart count to update
    await page.waitForTimeout(1500);

    // Navigate to /cart to verify
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // Take screenshot of cart page showing the added product
    await page.screenshot({ path: path.join(screenshotDir, "vince_cart.png") });

    // Assert cart header is visible
    const cartHeader = page.getByRole("heading", { name: "Your Cart" });
    await expect(cartHeader).toBeVisible();
  });

  // Test 8: Order History & Details Navigation (Lloyd)
  test("Test 8: Order History & Details Navigation (Lloyd)", async ({ page }) => {
    // Log in first to access protected account page
    await page.goto("/login");
    await page.fill('input[type="email"]', "customer.juan@demo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");

    // Navigate to account orders page
    await page.goto("/account/orders");
    await page.waitForLoadState("networkidle");

    // Take screenshot of orders history
    await page.screenshot({ path: path.join(screenshotDir, "lloyd_orders.png") });

    // Assert order history heading is present
    const ordersHeader = page.getByRole("heading", { name: "My Orders" });
    await expect(ordersHeader).toBeVisible();
  });

  // Test 9: Vendor Dashboard View (Jerve)
  test("Test 9: Vendor Dashboard View (Jerve)", async ({ page }) => {
    // Go to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Log in with vendor credentials
    await page.fill('input[type="email"]', "vendor.syndicate@demo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to home page
    await page.waitForURL("**/");
    await page.waitForLoadState("networkidle");

    // Navigate to /vendor
    await page.goto("/vendor");
    await page.waitForLoadState("networkidle");

    // Take screenshot of Vendor Dashboard
    await page.screenshot({ path: path.join(screenshotDir, "jerve_vendor.png") });

    // Assert vendor dashboard elements are visible
    const statsCard = page.getByText("Dashboard").first();
    await expect(statsCard).toBeVisible();
  });
});
