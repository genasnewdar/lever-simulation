import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000/ielts/example", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);

  try {
    await page.getByRole("button", { name: /start/i }).click({ timeout: 3000 });
  } catch {
    const btn = page.locator("button").first();
    await btn.click({ timeout: 3000 }).catch(() => {});
  }

  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/cur-listening.png", fullPage: false, animations: "disabled" });
  console.log("saved /tmp/cur-listening.png");

  // Click READING tab
  try {
    await page.getByRole("button", { name: /^reading$/i }).click({ timeout: 3000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "/tmp/cur-reading.png", fullPage: false, animations: "disabled" });
    console.log("saved /tmp/cur-reading.png");
  } catch (err) {
    console.log("reading tab not clickable:", err.message);
  }

  // Try writing
  try {
    await page.getByRole("button", { name: /^writing$/i }).click({ timeout: 3000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "/tmp/cur-writing.png", fullPage: false, animations: "disabled" });
    console.log("saved /tmp/cur-writing.png");
  } catch {}
} finally {
  await browser.close();
}
