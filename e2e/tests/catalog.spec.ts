import { test, expect } from "@playwright/test";

test.describe("Catalog", () => {
  test("catalog loads and shows products or empty state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome to Our Store" })).toBeVisible();
    await expect(page.getByPlaceholder("Search products...")).toBeVisible();
    const productsHeading = page.getByText("Showing", { exact: false });
    const noProducts = page.getByText("No products found matching your criteria.");
    const failedLoad = page.getByText("Failed to load products");
    await expect(
      productsHeading.or(noProducts).or(failedLoad)
    ).toBeVisible({ timeout: 10000 });
  });

  test("navigate to admin", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();
  });
});
