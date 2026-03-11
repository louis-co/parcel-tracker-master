import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3302";
const trackerId = process.env.AUDIT_TRACKER_ID ?? "";
const runDir = process.env.AUDIT_RUN_DIR;

if (!runDir) {
  throw new Error("AUDIT_RUN_DIR is required");
}

const screenshotDir = path.join(runDir, "screenshots");
const responseDir = path.join(runDir, "responses");
fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(responseDir, { recursive: true });

function dashboardSettings(selectedTrackerId) {
  const now = Date.now();
  return {
    __version: 7,
    convexUrl: "https://dutiful-bison-575.convex.cloud",
    functionPath: "queries:getDashboardEvents",
    argsJson: "{}",
    trackerFilter: selectedTrackerId,
    autoRefresh: false,
    refreshSeconds: 20,
    incomingSpeedUnit: "mph",
    displaySpeedUnit: "kmh",
    incrementalSync: true,
    timeFromIso: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    timeToIso: new Date(now).toISOString(),
  };
}

async function createContext(browser, opts = {}) {
  const context = await browser.newContext(opts);
  if (trackerId) {
    const settings = dashboardSettings(trackerId);
    await context.addInitScript(({ settingsValue }) => {
      localStorage.setItem("tracker-dashboard-settings", JSON.stringify(settingsValue));
    }, { settingsValue: settings });
  }
  return context;
}

function sanitizeNavTiming(navEntry) {
  if (!navEntry || typeof navEntry !== "object") return null;
  return {
    domContentLoadedEventEnd: navEntry.domContentLoadedEventEnd,
    loadEventEnd: navEntry.loadEventEnd,
    responseEnd: navEntry.responseEnd,
    transferSize: navEntry.transferSize,
  };
}

const browser = await chromium.launch({ headless: true });

const summary = {
  baseUrl,
  trackerId,
  checks: {},
  timings: {},
};

try {
  const context = await createContext(browser, { viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, "local_desktop_loaded.png"), fullPage: true });

  const timeInputs = page.locator('input[type="time"]');
  const timeInputCount = await timeInputs.count();
  if (timeInputCount >= 2) {
    await timeInputs.nth(0).fill("23:50");
    await timeInputs.nth(1).fill("01:10");
    await page.waitForTimeout(250);
  }

  const reversedDateNote = page.getByText(/Date range note:/i);
  summary.checks.reversedDateNoteVisible = await reversedDateNote.isVisible().catch(() => false);
  await page.screenshot({ path: path.join(screenshotDir, "local_reversed_date_note.png"), fullPage: true });

  await page.getByRole("button", { name: /Settings/i }).click();
  await page.waitForTimeout(300);

  await page.locator("#args-json").fill("{bad");
  await page.getByRole("button", { name: /Apply settings/i }).click();
  await page.waitForTimeout(250);

  const jsonErrorVisible = await page
    .getByText(/Function args must be valid JSON object syntax/i)
    .isVisible()
    .catch(() => false);
  summary.checks.invalidJsonRejected = jsonErrorVisible;
  await page.screenshot({ path: path.join(screenshotDir, "local_invalid_json_error.png"), fullPage: true });

  await page.locator("#args-json").fill("{}");
  await page.locator("#function-path").fill("queries:getDashboardEvents;DROP");
  await page.getByRole("button", { name: /Apply settings/i }).click();
  await page.waitForTimeout(250);

  const functionPathErrorVisible = await page
    .getByText(/Function path must look like module:function/i)
    .isVisible()
    .catch(() => false);
  summary.checks.invalidPathRejected = functionPathErrorVisible;
  await page.screenshot({ path: path.join(screenshotDir, "local_invalid_path_error.png"), fullPage: true });

  await page.locator("#function-path").fill("queries:getDashboardEvents");
  await page.locator("#plate-tracker-name").fill("<img src=x onerror=alert(1)>");
  await page.locator("#plate-value").fill("<script>alert(1)</script>");
  await page.getByRole("button", { name: /Assign plate/i }).click();
  await page.waitForTimeout(300);

  const plateErrorVisible = await page
    .getByText(/unsupported characters/i)
    .isVisible()
    .catch(() => false);
  summary.checks.injectionStylePlateRejected = plateErrorVisible;
  await page.screenshot({ path: path.join(screenshotDir, "local_plate_validation_error.png"), fullPage: true });

  const navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance
      .getEntriesByType("paint")
      .map((entry) => ({ name: entry.name, startTime: entry.startTime }));
    return { nav, paints };
  });
  summary.timings.desktop = {
    navigation: sanitizeNavTiming(navTiming.nav),
    paints: navTiming.paints,
  };

  await context.close();

  const slowContext = await createContext(browser, { viewport: { width: 1440, height: 900 } });
  const slowPage = await slowContext.newPage();
  await slowPage.route("**/api/query", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });

  await slowPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const skeleton = slowPage.locator('[data-slot="skeleton"]');
  const skeletonVisible = await skeleton.first().isVisible().catch(() => false);
  summary.checks.skeletonVisibleUnderSlowQuery = skeletonVisible;
  await slowPage.screenshot({ path: path.join(screenshotDir, "local_slow_network_skeleton.png"), fullPage: true });

  await slowContext.close();

  const mobileContext = await createContext(browser, {
    ...devices["iPhone 12"],
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(2500);
  await mobilePage.screenshot({ path: path.join(screenshotDir, "local_mobile_tracker.png"), fullPage: true });

  const hasHorizontalOverflow = await mobilePage.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  summary.checks.mobileHorizontalOverflow = hasHorizontalOverflow;

  await mobilePage.goto(`${baseUrl}/beacons`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1800);
  await mobilePage.screenshot({ path: path.join(screenshotDir, "local_mobile_beacons.png"), fullPage: true });

  const mobileNavTiming = await mobilePage.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance
      .getEntriesByType("paint")
      .map((entry) => ({ name: entry.name, startTime: entry.startTime }));
    return { nav, paints };
  });

  summary.timings.mobile = {
    navigation: sanitizeNavTiming(mobileNavTiming.nav),
    paints: mobileNavTiming.paints,
  };

  await mobileContext.close();
} finally {
  await browser.close();
}

const summaryPath = path.join(responseDir, "playwright_edge_audit_summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
