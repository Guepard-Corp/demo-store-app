import { test, expect } from "@playwright/test";

test.describe("Admin", () => {
  test("admin page loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();
    await expect(page.getByText("Total Products")).toBeVisible();
    await expect(page.getByText("Manage Products")).toBeVisible();
  });
});
