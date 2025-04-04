const base = require('@playwright/test');

const testPdf = {
    query: "grid-count-x=3&grid-count-y=3&grid-width=40&grid-height=40&grid-start-x=0&grid-start-y=0&grid-margin-x=0&grid-margin-y=0&grid-cut-margin=0",
    preset: {"grid-count-x":"3","grid-count-y":"3","grid-width":"40","grid-height":"40","grid-start-x":"0","grid-start-y":"0","grid-margin-x":"0","grid-margin-y":"0","grid-cut-margin":"0","grid-step-size":"0.1","cards-backs":"fileall","cards-rotate-backs":false,"_key":"test-pdf","_name":"Test PDF"},
    path: "./files/test-pdf.pdf",
    filename: "test-pdf.pdf",
    outputPathDefault: "./files/test-pdf.foldable.pdf",
    outputPathVerticalOnly: "./files/test-pdf.foldable.vertical.pdf",
    outputPathHorizontalOnly: "./files/test-pdf.foldable.horizontal.pdf",
    outputPathNoRows: "./files/test-pdf.foldable.no-rows.pdf",
    outputPathMiniFit: "./files/test-pdf.foldable.mini-fit.pdf",
    outputPathMiniCover: "./files/test-pdf.foldable.mini-cover.pdf",
    outputPathMiniStretch: "./files/test-pdf.foldable.mini-stretch.pdf",
    outputPathBorder: "./files/test-pdf.foldable.border.pdf",
    outputFilename: "test-pdf.foldable.pdf"
}

exports.test = base.test.extend({
    testGrid: async ({page}, use) => {
        await page.goto(`./?${TEST_PDF_PARAMS}`);
        await use(page);
    },

    testPdf: async ({}, use) => {
        await use(testPdf);
    },
})
exports.expect = base.expect;
