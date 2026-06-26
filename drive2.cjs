const { chromium } = require("playwright");

const SHOT_DIR = process.argv[2] || ".";
let n = 0;

async function shot(page, name) {
  n++;
  await page.waitForTimeout(500);
  const path = `${SHOT_DIR}/${String(n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log("SCREENSHOT:", path);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  try {
    // landing page
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Start Learning");
    await shot(page, "landing");

    // go to register from landing CTA
    await page.click("text=Start Learning");
    await page.waitForURL("**/register");
    await shot(page, "register");

    // register a brand new user
    const email = `duo-${Date.now()}@test.com`;
    await page.fill('input[type="text"]', "Duo Test");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', "test123");
    await page.click('button[type="submit"]');

    // should land on onboarding (level select)
    await page.waitForURL("**/onboarding", { timeout: 10000 });
    await page.waitForSelector("text=What is your English level?");
    await shot(page, "onboarding");

    // pick Elementary
    await page.click("text=Elementary");
    await page.waitForURL("**/courses", { timeout: 10000 });
    await page.waitForSelector("text=Welcome back");
    await shot(page, "courses-after-onboarding");

    // confirm localStorage has the level
    const level = await page.evaluate(() => localStorage.getItem("englishLevel"));
    console.log("STORED_LEVEL:", level);

    // now test logout -> landing's Login link -> login flow still works
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await page.click("text=Login / Войти");
    await page.waitForURL("**/login");
    await shot(page, "login-page");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', "test123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/courses", { timeout: 10000 });
    await shot(page, "login-then-courses-no-onboarding-replay");

    // confirm protected route redirect target
    await page.evaluate(() => localStorage.removeItem("token"));
    await page.goto("http://localhost:5173/courses", { waitUntil: "networkidle" });
    await page.waitForURL("**/login", { timeout: 10000 });
    await shot(page, "protected-redirect-to-login");
  } catch (e) {
    console.log("DRIVER ERROR:", e.message);
    await shot(page, "error-state");
  }

  console.log("CONSOLE_ERRORS:", JSON.stringify(consoleErrors));
  console.log("PAGE_ERRORS:", JSON.stringify(pageErrors));
  await browser.close();
})();
