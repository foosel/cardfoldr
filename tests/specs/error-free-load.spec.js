// @ts-check
const { test, expect } = require('@playwright/test');

test("Error free page load", async ({page}) => {
    const errors = [];
    page.on("pageerror", (error) => {
        errors.push(`[${error.name}] ${error.message}`);
    });
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            errors.push(`[${msg.type()}] ${msg.text()}`);
        }
    });

    await page.goto("./");

    await expect(errors).toStrictEqual([]);
});
