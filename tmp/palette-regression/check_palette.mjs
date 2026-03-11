import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = 'http://127.0.0.1:3100';
const outDir = '/Users/louishollinger/Documents/PROGRAMMING/parcel-tracker-master/tmp/palette-regression';
const themeKey = 'tracker-dashboard-theme';

const targets = [
  { name: 'trackers', url: `${base}/` },
  { name: 'beacons', url: `${base}/beacons?beaconId=ble:2164195606` },
  { name: 'parcels', url: `${base}/parcels?trackingId=TESTPKG-2164195606` },
];

const browser = await chromium.launch({ headless: true });
const summary = [];

for (const theme of ['dark', 'light']) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  await context.addInitScript(([key, value]) => {
    localStorage.setItem(key, value);
    document.documentElement.setAttribute('data-theme', value);
  }, [themeKey, theme]);

  for (const target of targets) {
    const page = await context.newPage();
    await page.goto(target.url, { waitUntil: 'networkidle' });
    const shot = path.join(outDir, `${target.name}-${theme}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    const computed = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const activeNav = document.querySelector('nav[aria-label="Primary page navigation"] a[aria-current="page"]');
      const activeStyles = activeNav ? getComputedStyle(activeNav) : null;
      const probe = document.createElement('span');
      probe.className = 'theme-status-live';
      probe.style.display = 'inline-block';
      document.body.appendChild(probe);
      const live = getComputedStyle(probe);
      const result = {
        accent: styles.getPropertyValue('--tone-accent').trim(),
        warning: styles.getPropertyValue('--tone-warning').trim(),
        danger: styles.getPropertyValue('--tone-danger').trim(),
        statusLiveBg: styles.getPropertyValue('--status-live-bg').trim(),
        statusInfoBg: styles.getPropertyValue('--status-info-bg').trim(),
        statusWarningBg: styles.getPropertyValue('--status-warning-bg').trim(),
        statusErrorBg: styles.getPropertyValue('--status-error-bg').trim(),
        activeNavColor: activeStyles?.color ?? null,
        activeNavBorder: activeStyles?.borderColor ?? null,
        liveColor: live.color,
        liveBg: live.backgroundColor,
        liveBorder: live.borderColor,
      };
      probe.remove();
      return result;
    });

    summary.push({ theme, page: target.name, screenshot: shot, computed });
    await page.close();
  }

  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, 'palette-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
