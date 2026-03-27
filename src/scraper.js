import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function scrape(handle, opts = {}) {
  const { limit = 1000, mode = 'followers' } = opts;

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
    if (err.message?.includes('clix') || err.message?.includes('uvx')) {
      throw new Error('CLIX not found. Install with: uv pip install clix0 && clix auth login --browser chrome');
    }
    throw new Error(`Scraping failed: ${err.message?.substring(0, 200)}`);
  }
}
