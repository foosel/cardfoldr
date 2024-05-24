// @ts-check
const { test, expect } = require('@playwright/test');

test("Load one PDF", async ({page}) => {
    await page.goto("./");

    await page.locator("#file").setInputFiles("./files/test-pdf.pdf");

    await expect(page.locator("#pages > .page")).toHaveCount(3);
});

test("Load two PDFs", async ({page}) => {
    await page.goto("./");

    await page.locator("#file").setInputFiles("./files/test-pdf.pdf");
    await page.locator("#background").setInputFiles("./files/test-pdf.pdf");

    await expect(page.locator("#pages > .page")).toHaveCount(3);
    await expect(page.locator("#pages-back > .page")).toHaveCount(3);
});
