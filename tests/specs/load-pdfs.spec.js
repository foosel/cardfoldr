// @ts-check
const { test, expect } = require('../fixtures');

test("Load one PDF", async ({page, testPdf}) => {
    await page.goto("./");

    await page.locator("#file").setInputFiles(testPdf.path);

    await expect(page.locator("#pages > .page")).toHaveCount(3);
});

test("Load two PDFs", async ({page, testPdf}) => {
    await page.goto("./");

    await page.locator("#file").setInputFiles(testPdf.path);
    await page.locator("#background").setInputFiles(testPdf.path);

    await expect(page.locator("#pages > .page")).toHaveCount(3);
    await expect(page.locator("#pages-back > .page")).toHaveCount(3);
});
