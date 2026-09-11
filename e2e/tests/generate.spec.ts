import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("generates the classic Sicherman pair for the default 2D6 search", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Sicherman dice" }).click();

  await expect(page.getByRole("heading", { name: "1 non-standard solution" })).toBeVisible();
  await expect(page.getByText("Sicherman-equivalent")).toBeVisible();
  await expect(page.locator('[aria-label="Labels for die 1"] .face')).toHaveText([
    "1",
    "2",
    "2",
    "3",
    "3",
    "4",
  ]);
  await expect(page.locator('[aria-label="Labels for die 2"] .face')).toHaveText([
    "1",
    "3",
    "4",
    "5",
    "6",
    "8",
  ]);
});

test("reveals the ordinary dice once the toggle is enabled", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Sicherman dice" }).click();
  await expect(page.getByRole("heading", { name: "1 non-standard solution" })).toBeVisible();

  // The checkbox itself is visually hidden behind a styled `<span>` toggle
  // track, so click the label (native `<label>` semantics forward the click
  // to the input) rather than the checkbox element.
  await page.locator(".toggle").click();

  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(page.getByText("ordinary", { exact: true })).toBeVisible();
  await expect(page.locator(".solution-card")).toHaveCount(2);
});

test("shows the underlying polynomial factorization", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Sicherman dice" }).click();
  await expect(page.getByRole("heading", { name: "1 non-standard solution" })).toBeVisible();

  await page.getByRole("button", { name: /Why does this work/i }).click();

  await expect(page.getByText("Encode a D6 as the generating polynomial")).toBeVisible();
  await expect(page.getByText("x + x^2 + x^3 + x^4 + x^5 + x^6")).toBeVisible();
});

test("searches a non-default configuration end to end", async ({ page }) => {
  const diceField = page.locator(".number-field", { hasText: "Number of dice" });
  await diceField.getByRole("button", { name: "Increase Number of dice" }).click();
  await expect(diceField.locator("input")).toHaveValue("3");

  await page.getByRole("button", { name: "Generate Sicherman dice" }).click();

  await expect(page.getByText(/Search complete/)).toBeVisible();
  await expect(page.getByText(/legal die polynomials were tested for 3D6/)).toBeVisible();
});
