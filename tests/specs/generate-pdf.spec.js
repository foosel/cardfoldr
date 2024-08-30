const { test, expect } = require('../fixtures');
const ComparePdf = require("compare-pdf");

//test.describe.configure({ mode: 'serial' });

const comparePdfConfig = {
    paths: {
        actualPdfRootFolder: process.cwd() + "/data/newActualPdfs",
        baselinePdfRootFolder: process.cwd() + "/data/baselinePdfs",
        actualPngRootFolder: process.cwd() + "/data/actualPngs",
        baselinePngRootFolder: process.cwd() + "/data/baselinePngs",
        diffPngRootFolder: process.cwd() + "/data/diffPngs"
    },
    settings: {
        density: 100,
        quality: 70,
        tolerance: 100,
        threshold: 0.05,
        cleanPngPaths: false,
        matchPageCount: true
    }
}

const pdfCompare = async (actual, expected) => {
    return await new ComparePdf(comparePdfConfig)   
        .actualPdfFile(actual)
        .baselinePdfFile(expected)
        .compare();
};

const checkPdf = async (download, expected, testInfo) => {
    if (testInfo.project.name === "chromium") {
        // compare PDFs, but only in Chrome for now due to different rendering in Firefox
        let result;
        try {
            result = await pdfCompare(await download.path(), expected);
        } catch (error) {
            result = { message: error };
        }

        const actualPath = testInfo.outputPath("test-pdf.foldable.pdf");
        await download.saveAs(actualPath);

        expect(result.message).toBeUndefined();
        expect(result.status).toBe("passed")
    }
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

test("PDF generation: defaults", async ({page, testPdf}, testInfo) => {
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
    await checkPdf(download, testPdf.outputPathDefault, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: vertical enforced", async ({page, testPdf}, testInfo) => {
    await page.locator("#foldLine").selectOption("vertical");

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
    await checkPdf(download, testPdf.outputPathVerticalOnly, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: horizontal enforced", async ({page, testPdf}, testInfo) => {
    await page.locator("#foldLine").selectOption("horizontal");

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
    await checkPdf(download, testPdf.outputPathHorizontalOnly, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: no rows", async ({page, testPdf}, testInfo) => {
    await page.locator("#allowMultipleRows").uncheck();

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
    await checkPdf(download, testPdf.outputPathNoRows, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: target size mini fit", async ({page, testPdf}, testInfo) => {
    await page.locator("#targetSizePresets").selectOption("mini");
    await page.locator("#targetAspectRatio").selectOption("fit");
    
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
    await checkPdf(download, testPdf.outputPathMiniFit, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: target size mini cover", async ({page, testPdf}, testInfo) => {
    await page.locator("#targetSizePresets").selectOption("mini");
    await page.locator("#targetAspectRatio").selectOption("cover");
    
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
    await checkPdf(download, testPdf.outputPathMiniCover, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: target size mini stretch", async ({page, testPdf}, testInfo) => {
    await page.locator("#targetSizePresets").selectOption("mini");
    await page.locator("#targetAspectRatio").selectOption("stretch");
    
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
    await checkPdf(download, testPdf.outputPathMiniStretch, testInfo);
    
    // cleanup
    await download.delete();
});

test("PDF generation: border", async ({page, testPdf}, testInfo) => {
    await page.locator("#innerBorderWidth").fill("1");
    await page.locator("#outerBorderWidth").fill("2");
    await page.locator("#roundCorners").fill("3");
    await page.locator("#backgroundColorFront").fill("#000000");
    await page.locator("#backgroundColorBack").fill("#000000");
    
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
    await checkPdf(download, testPdf.outputPathBorder, testInfo);
    
    // cleanup
    await download.delete();
});
