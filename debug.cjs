const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const heroBg = await page.evaluate(() => {
    const section = document.querySelector("section");
    const cs = getComputedStyle(section);
    return { backgroundImage: cs.backgroundImage, backgroundColor: cs.backgroundColor, height: section.offsetHeight };
  });
  console.log("HERO_SECTION_STYLE:", JSON.stringify(heroBg, null, 2));

  const h1 = await page.evaluate(() => {
    const el = document.querySelector("h1");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { text: el.textContent, opacity: cs.opacity, color: cs.color, transform: cs.transform };
  });
  console.log("H1_STYLE:", JSON.stringify(h1, null, 2));

  await page.screenshot({ path: `${process.argv[2]}/debug-landing.png`, fullPage: true });
  await browser.close();
})();
