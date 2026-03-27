import { chromium } from 'playwright-chromium';
import fs from 'fs';
import path from 'path';
import os from 'os';

const AUTH_DIR = path.join(os.homedir(), '.x-audit');
const COOKIE_FILE = path.join(AUTH_DIR, 'cookies.json');

export async function scrape(handle, opts = {}) {
  const { limit = 500, headless = true } = opts;
  
  const hasCookies = fs.existsSync(COOKIE_FILE);
  
  // Always show browser if no cookies (need login) or if user asked
  const useHeadless = headless && hasCookies;
  
  const browser = await chromium.launch({
    headless: useHeadless,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Load cookies if available
  if (hasCookies) {
    try {
      const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
      await context.addCookies(cookies);
    } catch {}
  }

  const page = await context.newPage();

  // Navigate to following page
  await page.goto(`https://x.com/${handle}/following`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Check if we're actually on the following page or got redirected
  const currentUrl = page.url();
  const isLoggedIn = currentUrl.includes('/following');
  


  if (!isLoggedIn) {
    if (useHeadless) {
      await browser.close();
      throw new Error('Authentication required. Run with --no-headless to log in interactively.');
    }

    // Navigate to login
    console.log('\n🔐 Login required. Please log in to X in the browser window.');
    console.log('   Waiting for you to complete login...\n');
    
    await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded' });
    
    // Wait until URL shows we're logged in (home feed or any non-login page)
    // Poll every 2 seconds for up to 5 minutes
    let loggedIn = false;
    for (let i = 0; i < 150; i++) {
      await page.waitForTimeout(2000);
      const url = page.url();
      if (url.includes('/home') || url === 'https://x.com/' || (!url.includes('/login') && !url.includes('/i/flow'))) {
        loggedIn = true;
        break;
      }
    }

    if (!loggedIn) {
      await browser.close();
      throw new Error('Login timed out. Please try again.');
    }

    console.log('   ✅ Logged in! Saving cookies...\n');

    // Save cookies
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));

    // Now navigate to following page
    await page.goto(`https://x.com/${handle}/following`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  // Scroll and collect profiles
  const profiles = new Map();
  let noNewCount = 0;
  const maxNoNew = 5;
  

  while (profiles.size < limit && noNewCount < maxNoNew) {
    const prevSize = profiles.size;
    
    const newProfiles = await page.evaluate(() => {
      const cells = document.querySelectorAll('[data-testid="UserCell"]');
      if (cells.length === 0) return [];
      return Array.from(cells).map(cell => {
        const link = cell.querySelector('a[href^="/"]');
        const href = link?.getAttribute('href')?.replace('/', '') || '';
        
        const nameEl = cell.querySelector('[dir="ltr"] > span');
        const displayName = nameEl?.textContent || '';
        
        // Get bio
        const divs = cell.querySelectorAll('div[dir="auto"]');
        let bio = '';
        for (const div of divs) {
          const text = div.textContent?.trim();
          if (text && text !== displayName && !text.startsWith('@') && text.length > 10) {
            bio = text;
          }
        }
        
        const verified = cell.querySelector('[data-testid="icon-verified"]') !== null ||
                        cell.querySelector('svg[aria-label="Verified account"]') !== null;
        
        return { handle: href, displayName, bio, verified };
      });
    });


    for (const p of newProfiles) {
      if (p.handle && !profiles.has(p.handle)) {
        profiles.set(p.handle, p);
        if (profiles.size % 50 === 0) {
          process.stdout.write(`\r   ${profiles.size} profiles...`);
        }
      }
    }

    if (profiles.size === prevSize) {
      noNewCount++;
    } else {
      noNewCount = 0;
    }

    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await page.waitForTimeout(800 + Math.random() * 400);
  }

  if (profiles.size > 0) {
    process.stdout.write('\r');
  }

  // Save cookies for next time
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  } catch {}

  await browser.close();
  return Array.from(profiles.values());
}
