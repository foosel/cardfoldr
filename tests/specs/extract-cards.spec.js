// @ts-check
const { test, expect } = require('@playwright/test');

const gotoPage = async (page) => {
    await page.goto("./?grid-count-x=3&grid-count-y=3&grid-width=40&grid-height=40&grid-start-x=0&grid-start-y=0&grid-margin-x=0&grid-margin-y=0&grid-cut-margin=0&grid-step-size=0.1&grid-source-pages=&grid-back-pages=");
}

const loadTestPdf = async (page) => {
    await page.locator("#file").setInputFiles("./files/test-pdf.pdf");
    await expect(page.locator("#pages > .page")).toHaveCount(3);
}

const loadTestPdfAsBack = async (page) => {
    await page.locator("#background").setInputFiles("./files/test-pdf.pdf");
    await expect(page.locator("#pages-back > .page")).toHaveCount(3);
}

const checkCards = async (page, count) => {
    await expect(page.locator("#cards > .card")).toHaveCount(count);

    for (let i = 1; i <= count; i++) {
        const card = await page.locator(`#cards > .card:nth-child(${i})`);
        const frontImg = await card.locator("img.front").first();
        const backImg = await card.locator("img.back").first();

        const width = frontImg.width;
        const height = frontImg.height;
    
        const options = {
            maxDiffPixelRatio: 0.02
        }
        await expect(frontImg).toHaveScreenshot(`card-${i}-front.png`, options);
        await expect(backImg).toHaveScreenshot(`card-${i}-back.png`, options);
    }
}

test("Card extraction: last page", async ({page}) => {
    await gotoPage(page);
    await loadTestPdf(page);

    await page.locator("[data-query='cards-backs']").selectOption("lastpage");
    await page.locator("#extractCards").click();

    await checkCards(page, 18);
});

test("Card extraction: duplex right", async ({page}) => {
    await gotoPage(page);
    await loadTestPdf(page);

    await page.locator("#pages > .page:nth-child(3) .page-info").first().click();
    await expect(page.locator("#pages > .page:nth-child(3)")).toHaveClass(/excluded/);
    await page.locator("[data-query='cards-backs']").selectOption("duplex");
    await page.locator("#extractCards").click();

    await checkCards(page, 9);
});

test("Card extraction: duplex down", async ({page}) => {
    await gotoPage(page);
    await loadTestPdf(page);

    await page.locator("#pages > .page:nth-child(3) .page-info").first().click();
    await expect(page.locator("#pages > .page:nth-child(3)")).toHaveClass(/excluded/);
    await page.locator("[data-query='cards-backs']").selectOption("duplex2");
    await page.locator("#extractCards").click();

    await checkCards(page, 9);
});

test("Card extraction: file single", async ({page}) => {
    await gotoPage(page);
    await loadTestPdf(page);
    await loadTestPdfAsBack(page);

    await page.locator("[data-query='cards-backs']").selectOption("file");
    await page.locator("#extractCards").click();

    await checkCards(page, 27);
});

test("Card extraction: file all", async ({page}) => {
    await gotoPage(page);
    await loadTestPdf(page);
    await loadTestPdfAsBack(page);

    await page.locator("[data-query='cards-backs']").selectOption("fileall");
    await page.locator("#extractCards").click();

    await checkCards(page, 27);
});
