import { chromium } from "playwright";

const pages = [
  { url: "http://localhost:3000/ielts", out: "/tmp/cur-landing.png" },
  { url: "http://localhost:3000/ielts/example", out: "/tmp/cur-example.png", waitMs: 1500 },
  { url: "http://localhost:3000/ielts/mock-exam", out: "/tmp/cur-mockexam.png" },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const p of pages) {
  const page = await context.newPage();
  await page.goto(p.url, { waitUntil: "networkidle" });
  if (p.waitMs) await page.waitForTimeout(p.waitMs);
  await page.screenshot({ path: p.out, fullPage: false });
  await page.close();
  console.log("saved", p.out);
}
await browser.close();
