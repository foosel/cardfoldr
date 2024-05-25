// @ts-check
const { test, expect } = require('../fixtures');

test("Fill inputs from query", async ({page}) => {
    await page.goto("./?grid-count-x=3&grid-count-y=3&grid-width=40&grid-height=40&grid-start-x=0&grid-start-y=0&grid-margin-x=0&grid-margin-y=0&grid-cut-margin=0&grid-step-size=0.1&grid-source-pages=&grid-back-pages=&cards-backs=fileall&cards-optimize=filesize&cards-rotate-backs=false&output-page-size=A4&output-foldline=vertical&output-edge=bottom&output-printer-margin=5&output-card-margin=2&output-folding-margin=2&output-cutter-offset=0");

    // verify the inputs are filled
    await expect(page.locator("[data-query='grid-count-x']")).toHaveValue("3");
    await expect(page.locator("[data-query='grid-count-y']")).toHaveValue("3");
    await expect(page.locator("[data-query='grid-width']")).toHaveValue("40");
    await expect(page.locator("[data-query='grid-height']")).toHaveValue("40");
    await expect(page.locator("[data-query='grid-start-x']")).toHaveValue("0");
    await expect(page.locator("[data-query='grid-start-y']")).toHaveValue("0");
    await expect(page.locator("[data-query='grid-margin-x']")).toHaveValue("0");
    await expect(page.locator("[data-query='grid-margin-y']")).toHaveValue("0");
    await expect(page.locator("[data-query='grid-cut-margin']")).toHaveValue("0");
    await expect(page.locator("[data-query='grid-step-size']")).toHaveValue("0.1");
    await expect(page.locator("[data-query='grid-source-pages']")).toHaveValue("");
    await expect(page.locator("[data-query='grid-back-pages']")).toHaveValue("");

    await expect(page.locator("[data-query='cards-backs']")).toHaveValue("fileall");
    await expect(page.locator("[data-query='cards-optimize']")).toHaveValue("filesize");
    await expect(page.locator("[data-query='cards-rotate-backs']")).not.toBeChecked();

    await expect(page.locator("[data-query='output-page-size']")).toHaveValue("A4");
    await expect(page.locator("[data-query='output-foldline']")).toHaveValue("vertical");
    await expect(page.locator("[data-query='output-edge']")).toHaveValue("bottom");
    await expect(page.locator("[data-query='output-printer-margin']")).toHaveValue("5");
    await expect(page.locator("[data-query='output-card-margin']")).toHaveValue("2");
    await expect(page.locator("[data-query='output-folding-margin']")).toHaveValue("2");
    await expect(page.locator("[data-query='output-cutter-offset']")).toHaveValue("0");
});
