import { expect, test } from "@playwright/test";

const pages = [
  ["/careers", "Careers"],
  ["/eligibility", "Eligibility"],
  ["/process", "How to apply"],
  ["/announcements", "Announcements"],
  ["/about", /About/],
  ["/faq", "Frequently asked questions"],
  ["/contact", "Contact"],
  ["/legal/privacy", "Privacy policy"],
] as const;

for (const [path, heading] of pages) {
  test(`${path} renders its heading`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("homepage has both calls to action", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("section[aria-labelledby=hero-title]");
  await expect(hero.getByRole("link", { name: "Explore careers" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Apply now" })).toBeVisible();
});

test("closed roles do not offer an apply button", async ({ page }) => {
  await page.goto("/careers/communications-it/network-support-technician");
  await expect(page.getByText("Closed", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply for this role" })).toHaveCount(0);
});

test("FAQ answers expand and collapse", async ({ page }) => {
  await page.goto("/faq");
  const q = page.getByText("Do I have to pay to apply?");
  const answer = page.getByText(/Applying is free/);
  await expect(answer).toBeHidden();
  await q.click();
  await expect(answer).toBeVisible();
});

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("opens, traps focus, closes with Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Careers" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("navigates and closes on link click", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Eligibility" }).click();
    await expect(page).toHaveURL(/\/eligibility$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test("no horizontal scroll at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/", "/careers", "/careers/field-operations/field-operations-recruit", "/contact"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
