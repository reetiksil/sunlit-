import { test, expect } from "@playwright/test";

test("open a book, open reader, change font size, advance chapter, and toggle night mode", async ({
  page,
}) => {
  await page.goto("/");

  // 1. Open featured book reader directly or via book detail
  await page.getByRole("link", { name: /Start Reading/i }).first().click();
  await expect(page).toHaveURL(/\/book\/.*\/chapter\/1/);

  // 2. Open reader settings and adjust font size slider
  await page.getByRole("button", { name: /Open reader appearance settings/i }).click();
  const slider = page.getByLabel(/Font Size/i);
  await slider.fill("24");
  await expect(page.getByText("24px")).toBeVisible();
  await page.getByRole("button", { name: /Close reader settings/i }).click();

  // 3. Go to the next chapter
  await page.getByRole("button", { name: /Next Chapter/i }).click();
  await expect(page).toHaveURL(/\/book\/.*\/chapter\/2/);

  // 4. Toggle night mode
  const themeBtn = page.getByRole("button", {
    name: /Switch to calm twilight night mode/i,
  });
  await themeBtn.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});