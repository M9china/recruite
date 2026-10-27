import { expect, type Page, test } from "@playwright/test";

/**
 * Full application journey against the real stack (Next.js, PostgreSQL, local
 * document storage). Needs at least one open role in the database (CI seeds them).
 */

// Smallest valid files of each kind: the server checks content, not names.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);

const next = (page: Page) => page.getByRole("button", { name: "Continue" }).click();

test("an applicant can complete and submit the questionnaire", async ({ page }, testInfo) => {
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
  await page.goto("/apply");

  // 1. Role
  await page.getByRole("group", { name: "Which role are you applying for?" }).getByRole("radio").first().check();
  await next(page);

  // 2. About you — empty submit first
  await next(page);
  await expect(page.getByRole("alert").filter({ hasText: "There is a problem" })).toBeVisible();
  await page.getByLabel("Surname").fill("Dlamini");
  await page.getByLabel("First name").fill("Thabo");
  await page.getByLabel("Never married").check();
  await next(page);

  // 3. Parents
  await page.getByRole("group", { name: "Do you have a father?" }).getByLabel("No").check();
  await page.getByRole("group", { name: "Do you have a mother?" }).getByLabel("Yes").check();
  await page.locator("#f-parents-mother-details-surname").fill("Dlamini");
  await page.locator("#f-parents-mother-details-firstNames").fill("Nomsa");
  await page.locator("#f-parents-mother-details-dateOfBirth").fill("1970-05-01");
  await page.locator("#f-parents-mother-details-placeOfBirth").fill("Soweto, South Africa");
  await next(page);

  // 4. Address and contact
  await page.getByLabel("I do not have a permanent place of residence").check();
  await page.locator("#f-contact-phones-0").fill("+27 82 123 4567");
  await page.locator("#f-contact-emails-0").fill(email);
  await next(page);

  // 5. Work and education
  await page.getByLabel(/I do not work\/have never worked/).check();
  await next(page);

  // 6. Documents
  await next(page);
  await expect(page.getByText("Upload your photo").first()).toBeVisible();
  await page.locator("#photo-upload").setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: EXE });
  await expect(page.locator("#photo-upload-error")).toContainText("JPG or PNG");
  await page.locator("#photo-upload").setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(page.getByRole("button", { name: "Remove photo" })).toBeVisible();
  await page.locator("#other-upload").setInputFiles({ name: "id.pdf", mimeType: "application/pdf", buffer: PDF });
  await expect(page.getByRole("button", { name: "Remove id.pdf" })).toBeVisible();
  await next(page);

  // 7. Review and submit
  await expect(page.getByRole("heading", { name: /Check and submit/ })).toBeVisible();
  await page.getByLabel(/answered all questions truthfully/).check();
  await page.getByLabel(/matches my documents/).check();
  await page.getByLabel(/data-processing notice/).check();
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page).toHaveURL(/\/apply\/confirmation\?ref=APP-\d{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
});

test.describe("public API protections", () => {
  test("rejects an incomplete application with field errors", async ({ request }) => {
    const res = await request.post("/api/public/v1/applications", { data: { opportunitySlug: "x" } });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(body.error.fieldErrors).length).toBeGreaterThan(0);
  });

  test("rejects cross-site posts", async ({ request }) => {
    const res = await request.post("/api/public/v1/applications", {
      data: {},
      headers: { Origin: "https://attacker.example" },
    });
    expect(res.status()).toBe(403);
  });

  test("offers no way to read submitted applications", async ({ request }) => {
    const res = await request.get("/api/public/v1/applications");
    expect(res.status()).toBe(405);
  });
});
