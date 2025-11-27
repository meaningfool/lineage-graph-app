import { test } from "@playwright/test";

test("debug - capture page HTML", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait a bit for client hydration
    await page.waitForTimeout(2000);

    // Log the HTML
    const html = await page.content();
    console.log("=== PAGE HTML ===");
    console.log(html);

    // Check if our button is in there
    const hasTestButton = html.includes('test-file-upload-button');
    console.log("\n=== BUTTON CHECK ===");
    console.log("Has test-file-upload-button:", hasTestButton);
    console.log("Has Test File Upload text:", html.includes('Test File Upload'));
});
