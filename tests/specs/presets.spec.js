// @ts-check
const { test, expect } = require('../fixtures');

test.describe.configure({ mode: 'parallel' });

const pageStorage = async (page) => {
    const innerLocalStorage = async (page) => {
        return await page.evaluateHandle(() => {
            return window.localStorage;
        });
    }
    
    return {
        setItem: async (key, value) => {
            const inner = await innerLocalStorage(page);
            await inner.evaluate((storage, {key, value}) => {
                storage.setItem(key, value);
            }, {key, value});
        },
        getItem: async (key) => {
            const inner = await innerLocalStorage(page);
            return await inner.evaluate((storage, key) => {
                return storage.getItem(key);
            }, key);
        },
        hasItem: async (key) => {
            const inner = await innerLocalStorage(page);
            return await inner.evaluate((storage, key) => {
                return storage.getItem(key) !== null;
            }, key);
        },
        removeItem: async (key) => {
            const inner = await innerLocalStorage(page);
            await inner.evaluate((storage, key) => {
                storage.removeItem(key);
            }, key);
        },
        getAll: async () => {
            const inner = await innerLocalStorage(page);
            return await inner.evaluate((storage) => {
                return storage;
            });
        }
    }
};

test.beforeEach(async ({page, testPdf}) => {
    await page.goto("./");
    const storage = await pageStorage(page);
    await storage.setItem("preset-test-pdf", JSON.stringify(testPdf.preset));
    console.log("Local Storage:", await storage.getAll());
    await page.reload();
});

test("List presets", async ({page}) => {
    await expect(page.locator("#preset option")).toHaveCount(2);
    await expect(page.locator("#preset option").first()).toHaveText("Custom...");
    await expect(page.locator("#preset option").last()).toHaveText("Test PDF");
});

test("Add preset", async ({page}) => {
    await page.locator("#countX").fill("4");
    await page.locator("#countY").fill("8");

    page.on("dialog", async (dialog) => {
        await dialog.accept("Shiny new preset");
    });
    await page.locator("#saveNewPreset").click();

    const storage = await pageStorage(page);
    console.log("Local Storage:", await storage.getAll());
    await expect(storage.hasItem("preset-shiny-new-preset")).toBeTruthy();

    await expect(page.locator("#preset option")).toHaveCount(3);
    await expect(page.locator("#preset")).toHaveValue("shiny-new-preset");
});

test("Update preset", async ({page, testPdf}) => {
    await page.locator("#preset").selectOption("Test PDF");

    await expect(page.locator("#width")).toHaveValue("40");
    await expect(page.locator("#height")).toHaveValue("40");
    await expect(page.locator("#updatePreset")).toBeDisabled();

    await page.locator("#width").fill("42");
    await page.locator("#height").fill("42");
    await expect(page.locator("#updatePreset")).toBeEnabled();
    await page.locator("#updatePreset").click();

    const storage = await pageStorage(page);
    console.log("Local Storage:", await storage.getAll());
    await expect(storage.hasItem("preset-test-pdf")).toBeTruthy();

    const updatedPreset = JSON.parse(await storage.getItem("preset-test-pdf"));
    expect(updatedPreset).toEqual({...testPdf.preset, "grid-width": "42", "grid-height": "42"});
});

test("Delete preset", async ({page, testPdf}) => {
    await expect(page.locator("#preset option")).toHaveCount(2);
    await expect(page.locator("#preset")).toHaveValue("");
    await expect(page.locator("#deletePreset")).toBeDisabled();

    await page.locator("#preset").selectOption("Test PDF");
    await expect(page.locator("#preset")).toHaveValue("test-pdf");
    await expect(page.locator("#deletePreset")).toBeEnabled();

    page.on("dialog", async (dialog) => {
        await dialog.accept();
    });
    await page.locator("#deletePreset").click();

    const storage = await pageStorage(page);
    await expect(await storage.hasItem("preset-test-pdf")).toBeFalsy();

    await expect(page.locator("#preset option")).toHaveCount(1);
    await expect(page.locator("#preset")).toHaveValue("");
    await expect(page.locator("#deletePreset")).toBeDisabled();
    await expect(page.locator("#updatePreset")).toBeDisabled();
});

test("Preset management disabled for default", async ({page}) => {
    await expect(page.locator("#deletePreset")).toBeDisabled();
    await expect(page.locator("#updatePreset")).toBeDisabled();
});