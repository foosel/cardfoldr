const { test, expect } = require('../fixtures');
const ComparePdf = require("compare-pdf");
const fs = require("fs");

const pdfCompare = async (actual, expected) => {
    return await new ComparePdf()   
        .actualPdfFile(actual)
        .baselinePdfFile(expected)
        .compare();
};

test.beforeEach(async ({page, testPdf}) => {
    await page.goto(`./?${testPdf.query}`);

    // load test PDF
    await page.locator("#file").setInputFiles(testPdf.path);
    await expect(page.locator("#pages > .page")).toHaveCount(3);

    // extract cards
    await expect(page.locator("#generate")).toBeDisabled();
    await page.locator("[data-query='cards-backs']").selectOption("lastpage");
    await page.locator("#extractCards").click();
    await expect(page.locator("#cards > .card")).toHaveCount(18);
    await expect(page.locator("#generate")).toBeEnabled();
});

test("Simple PDF generation", async ({page, testPdf}, testInfo) => {
    // generate PDF
    await page.locator("#generate").click();

    // verify the PDF is generated
    await expect(await page.locator("#download-button").getAttribute("href")).toContain("blob:");
    await expect(await page.locator("#output iframe").getAttribute("src")).toContain("blob:");

    // download PDF
    const downloadPromise = page.waitForEvent('download');
    await expect(await page.locator("#download-button").getAttribute("download")).toBe(testPdf.outputFilename);
    await page.locator("#download-button").click();
    const download = await downloadPromise;

    // verify the PDF is downloaded
    expect(download.url()).toContain("blob:");
    expect(download.suggestedFilename()).toMatch(/.pdf$/i);

    if (testInfo.project === "chromium") {
        // compare PDFs, but only in Chrome for now due to different rendering in Firefox
        let result;
        try {
            result = await pdfCompare(await download.path(), testPdf.outputPath);
        } catch (error) {
            result = error;
        }
        expect(result.message).toBeUndefined();
        expect(result.status).toBe("passed")    
    }
    
    // cleanup
    await download.delete();
});
