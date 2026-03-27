import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function ensureDependencies() {
  // Check for uv (fast Python package manager)
  if (!commandExists('uv')) {
    console.error('\n⚠️  Missing dependency: uv (Python package manager)');
    console.error('   x-audit uses uv to run CLIX for Twitter/X API access.\n');
    
    const answer = await prompt('   Install uv now? [Y/n] ');
    if (answer === 'n' || answer === 'no') {
      throw new Error('uv is required. Install manually: curl -LsSf https://astral.sh/uv/install.sh | sh');
    }
    
    console.log('\n   Installing uv...');
    try {
      execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', { 
        stdio: 'inherit',
        shell: true 
      });
      // Source the shell to get uv in path
      process.env.PATH = `${os.homedir()}/.local/bin:${process.env.PATH}`;
      console.log('   ✅ uv installed!\n');
    } catch (err) {
      throw new Error('Failed to install uv. Install manually: curl -LsSf https://astral.sh/uv/install.sh | sh');
    }
  }

  // Check if CLIX is authenticated
  const authFile = path.join(os.homedir(), '.clix', 'auth.json');
  if (!fs.existsSync(authFile)) {
    console.error('\n⚠️  CLIX not authenticated');
    console.error('   x-audit needs access to your Twitter/X account to fetch data.\n');
    
    const answer = await prompt('   Open browser to authenticate? [Y/n] ');
    if (answer === 'n' || answer === 'no') {
      throw new Error('Authentication required. Run: uvx --with clix0 clix auth login --browser chrome');
    }
    
    console.log('\n   Opening browser for Twitter/X login...');
    console.log('   (Log in, then return here)\n');
    try {
      execSync('uvx --with clix0 clix auth login --browser chrome', { 
        stdio: 'inherit',
        env: { ...process.env, PATH: `${os.homedir()}/.local/bin:${process.env.PATH}` }
      });
      console.log('   ✅ Authenticated!\n');
    } catch (err) {
      throw new Error('Authentication failed. Try manually: uvx --with clix0 clix auth login --browser chrome');
    }
  }
}

export async function scrape(handle, opts = {}) {
  const { limit = 1000, mode = 'followers' } = opts;

  // Ensure uv and CLIX auth are set up
  await ensureDependencies();

  // Write Python script to temp file
  const tmpScript = path.join(os.tmpdir(), `x-audit-fetch-${Date.now()}.py`);
  fs.writeFileSync(tmpScript, `
import json, sys, time
from clix.core.client import XClient
from clix.core.api import get_followers, get_following, get_user_by_handle

handle = "${handle}"
limit = ${limit}
mode = "${mode}"

client = XClient()
user = get_user_by_handle(client, handle)
if not user:
    print(json.dumps([]))
    sys.exit(0)

print(f"Fetching {mode} for @{handle}...", file=sys.stderr)

all_users = []
cursor = None
page = 0
fetch_fn = get_followers if mode == "followers" else get_following

while len(all_users) < limit:
    page += 1
    try:
        users, next_cursor = fetch_fn(client, user.id, count=50, cursor=cursor)
    except Exception as e:
        print(f"  Rate limited or error on page {page}: {e}", file=sys.stderr)
        break
    if not users:
        break
    all_users.extend(users)
    if len(all_users) % 200 < 51:
        print(f"  {len(all_users)} profiles...", file=sys.stderr)
    if not next_cursor or next_cursor == cursor:
        break
    cursor = next_cursor
    time.sleep(0.8)

result = []
for u in all_users[:limit]:
    result.append({
        "handle": u.handle,
        "name": u.name,
        "bio": u.bio or "",
        "location": u.location or "",
        "verified": u.verified,
        "followers_count": u.followers_count,
        "following_count": u.following_count,
        "tweet_count": getattr(u, 'tweet_count', None),
        "profile_image_url": getattr(u, 'profile_image_url', ''),
    })

print(json.dumps(result))
print(f"Done: {len(result)} total", file=sys.stderr)
`);

  try {
    const raw = execSync(`uvx --with clix0 python "${tmpScript}"`, {
      timeout: limit * 1500,
      maxBuffer: 100 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'inherit'],
    }).toString();

    // Cleanup
    try { fs.unlinkSync(tmpScript); } catch {}

    const data = JSON.parse(raw);

    return data.map(d => ({
      handle: d.handle,
      displayName: d.name,
      bio: [d.bio, d.location].filter(Boolean).join(' | '),
      verified: d.verified,
      followersCount: d.followers_count,
      followingCount: d.following_count,
      tweetCount: d.tweet_count,
      profileImageUrl: d.profile_image_url,
      location: d.location,
    }));
  } catch (err) {
    try { fs.unlinkSync(tmpScript); } catch {}
    const msg = err.message || '';
    if (msg.includes('Rate limit') || msg.includes('429')) {
      throw new Error('Twitter/X rate limited. Wait a few minutes and try again, or reduce --limit.');
    }
    if (msg.includes('clix') || msg.includes('uvx') || msg.includes('ModuleNotFoundError')) {
      throw new Error('CLIX setup issue. Try: uvx --with clix0 clix auth login --browser chrome');
    }
    throw new Error(`Scraping failed: ${msg.substring(0, 200)}`);
  }
}
