const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleMsgs = [];
  const failedRequests = [];
  const allResponses = [];

  page.on("console", (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("requestfailed", (req) =>
    failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`)
  );
  page.on("response", (res) => {
    if (res.url().includes("/auth/")) {
      allResponses.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto("http://localhost:5173/register", { waitUntil: "networkidle" });
  await page.fill('input[type="text"]', "Repro2 User");
  const email = `repro2-${Date.now()}@test.com`;
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "test123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  const url = page.url();
  const errorText = await page.locator(".bg-red-50").textContent().catch(() => null);

  console.log("FINAL_URL:", url);
  console.log("FORM_ERROR:", errorText);
  console.log("AUTH_RESPONSES:", JSON.stringify(allResponses, null, 2));
  console.log("FAILED_REQUESTS:", JSON.stringify(failedRequests, null, 2));
  console.log("CONSOLE:", JSON.stringify(consoleMsgs, null, 2));

  await browser.close();
})();
