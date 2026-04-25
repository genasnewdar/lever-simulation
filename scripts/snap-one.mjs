import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000/ielts";
const out = process.argv[3] || "/tmp/snap.png";

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts ? document.fonts.ready : null);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out, fullPage: false, animations: "disabled" });
  console.log("saved", out);
} finally {
  await browser.close();
}
