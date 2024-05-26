// @ts-check
const { test, expect } = require('../fixtures');

test.describe.configure({ mode: 'parallel' });

const checkCards = async (page, count) => {
    await expect(page.locator("#cards > .card")).toHaveCount(count);

    for (let i = 1; i <= count; i++) {
        const card = await page.locator(`#cards > .card:nth-child(${i})`);
        const frontImg = await card.locator("img.front").first();
        const backImg = await card.locator("img.back").first();

        const width = frontImg.width;
        const height = frontImg.height;
    
        const options = {
            maxDiffPixelRatio: 0.1
        }
        await expect(frontImg).toHaveScreenshot(`card-${i}-front.png`, options);
        await expect(backImg).toHaveScreenshot(`card-${i}-back.png`, options);
    }
}

test.describe("Card extraction: single file", () => {
    test.beforeEach(async ({page, testPdf}) => {
        await page.goto(`./?${testPdf.query}`);
        await page.locator("#file").setInputFiles(testPdf.path);
        await expect(page.locator("#pages > .page")).toHaveCount(3);
    });

    test("last page", async ({page}) => {
        await page.locator("[data-query='cards-backs']").selectOption("lastpage");
        await page.locator("#extractCards").click();
    
        await checkCards(page, 18);
    });
    
    test("duplex right", async ({page}) => {
        await page.locator("#pages > .page:nth-child(3) .page-info").first().click();
        await expect(page.locator("#pages > .page:nth-child(3)")).toHaveClass(/excluded/);

        await page.locator("[data-query='cards-backs']").selectOption("duplex");
        await page.locator("#extractCards").click();
    
        await checkCards(page, 9);
    });
    
    test("duplex down", async ({page}) => {
        await page.locator("#pages > .page:nth-child(3) .page-info").first().click();
        await expect(page.locator("#pages > .page:nth-child(3)")).toHaveClass(/excluded/);

        await page.locator("[data-query='cards-backs']").selectOption("duplex2");
        await page.locator("#extractCards").click();
    
        await checkCards(page, 9);
    });
});

test.describe("Card extraction: front and back file", () => {
    test.beforeEach(async ({page, testPdf}) => {
        await page.goto(`./?${testPdf.query}`);

        await page.locator("#file").setInputFiles(testPdf.path);
        await expect(page.locator("#pages > .page")).toHaveCount(3);

        await page.locator("#background").setInputFiles(testPdf.path);
        await expect(page.locator("#pages-back > .page")).toHaveCount(3);
    });

    test("first page", async ({page}) => {
        await page.locator("[data-query='cards-backs']").selectOption("file");
        await page.locator("#extractCards").click();

        await checkCards(page, 27);
    });

    test("all pages", async ({page}) => {
        await page.locator("[data-query='cards-backs']").selectOption("fileall");
        await page.locator("#extractCards").click();

        await checkCards(page, 27);
    });
});