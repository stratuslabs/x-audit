import { chromium } from 'playwright-chromium';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

const AUTH_DIR = path.join(os.homedir(), '.x-audit');
const COOKIE_FILE = path.join(AUTH_DIR, 'cookies.json');

async function waitForLogin(page) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n🔐 Login required. A browser window will open.');
  console.log('   Please log in to X/Twitter, then press Enter here.\n');
  
  await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded' });
  
  await new Promise(resolve => {
    rl.question('   Press Enter after logging in... ', () => {
      rl.close();
      resolve();
    });
  });

  // Save cookies
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const cookies = await page.context().cookies();
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  console.log('   ✅ Cookies saved for future runs\n');
}

export async function scrape(handle, opts = {}) {
  const { limit = 500, headless = true } = opts;
  
  const hasCookies = fs.existsSync(COOKIE_FILE);
  const needsLogin = !hasCookies;
  
  const browser = await chromium.launch({
    headless: needsLogin ? false : headless,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  // Load cookies if we have them
  if (hasCookies) {
    try {
      const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
      await context.addCookies(cookies);
    } catch {
      // Bad cookies, will re-auth
    }
  }

  const page = await context.newPage();

  // Navigate to following page
  await page.goto(`https://x.com/${handle}/following`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Check if we need to log in
  const loginNeeded = await page.evaluate(() => {
    return document.querySelector('[data-testid="loginButton"]') !== null ||
           document.querySelector('input[autocomplete="username"]') !== null ||
           window.location.href.includes('/login');
  });

  if (loginNeeded) {
    await waitForLogin(page);
    await page.goto(`https://x.com/${handle}/following`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }

  // Scroll and collect profiles
  const profiles = new Map();
  let noNewCount = 0;
  const maxNoNew = 5; // Stop after 5 scrolls with no new profiles
  
  while (profiles.size < limit && noNewCount < maxNoNew) {
    const prevSize = profiles.size;
    
    const newProfiles = await page.evaluate(() => {
      const cells = document.querySelectorAll('[data-testid="UserCell"]');
      return Array.from(cells).map(cell => {
        const nameEl = cell.querySelector('[dir="ltr"] > span');
        const handleEl = cell.querySelectorAll('[dir="ltr"] > span');
        const bioEl = cell.querySelector('[data-testid="UserCell"] > div > div:last-child > div:nth-child(2)');
        
        // Try to get the handle from the link
        const link = cell.querySelector('a[href^="/"]');
        const href = link?.getAttribute('href')?.replace('/', '') || '';
        
        // Get all text content from the cell
        const allText = cell.textContent || '';
        
        // Get display name
        const displayName = nameEl?.textContent || '';
        
        // Get bio - it's usually the last text block
        const divs = cell.querySelectorAll('div[dir="auto"]');
        let bio = '';
        for (const div of divs) {
          const text = div.textContent?.trim();
          if (text && text !== displayName && !text.startsWith('@') && text.length > 10) {
            bio = text;
          }
        }
        
        // Check for verified badge
        const verified = cell.querySelector('[data-testid="icon-verified"]') !== null ||
                        cell.querySelector('svg[aria-label="Verified account"]') !== null;
        
        return {
          handle: href,
          displayName,
          bio,
          verified,
        };
      });
    });

    for (const p of newProfiles) {
      if (p.handle && !profiles.has(p.handle)) {
        profiles.set(p.handle, p);
        if (profiles.size % 50 === 0) {
          process.stdout.write(`   ${profiles.size} profiles...`);
          process.stdout.write('\r');
        }
      }
    }

    if (profiles.size === prevSize) {
      noNewCount++;
    } else {
      noNewCount = 0;
    }

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await page.waitForTimeout(800 + Math.random() * 400);
  }

  // Save updated cookies
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const cookies = await page.context().cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  } catch {}

  await browser.close();

  return Array.from(profiles.values());
}
