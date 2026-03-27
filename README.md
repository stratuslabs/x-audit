# x-audit

Analyze any X/Twitter account's followers. One command → beautiful shareable report.

```bash
npx x-audit @username
```

## What it does

1. Fetches followers via [CLIX](https://github.com/spideystreet/clix) with automatic pagination (no X API key needed)
2. Analyzes every bio — professional categories, locations, follower tiers, keywords
3. Scores follower quality — flags bots, spam accounts, and low-quality followers
4. Benchmarks your audience against X platform averages
5. Generates a polished dark-mode dashboard
6. Publishes to [gui.new](https://gui.new) and auto-opens in your browser

## Prerequisites

[CLIX](https://github.com/spideystreet/clix) must be installed and authenticated:

```bash
uv pip install clix0
clix auth login --browser chrome
```

## Install

```bash
# From npm (recommended)
npx x-audit @username

# Or install globally
npm i -g x-audit
x-audit @username
```

## Options

```
Usage: x-audit [options] <handle>

Options:
  -l, --limit <n>      Max profiles to fetch (default: 1000)
  --mode <type>        followers or following (default: followers)
  --spam               Generate a dedicated spam/bot report
  --json               Output raw JSON analysis
  --html <file>        Save HTML report locally
  --gui-key <key>      gui.new Pro API key for 30d expiry
  --no-gui             Skip publishing to gui.new
  -h, --help           Show help
```

## Examples

```bash
# Analyze your followers (default 1000)
npx x-audit @username

# Analyze who someone follows
npx x-audit @username --mode following

# Get more profiles
npx x-audit @username --limit 5000

# Spam/bot report only
npx x-audit @username --spam

# Save locally without publishing
npx x-audit @username --no-gui --html report.html

# Use gui.new Pro for 30-day link expiry
npx x-audit @username --gui-key YOUR_KEY
```

## What's in the report

- **Summary cards** — total analyzed, top category, verified %, bio coverage
- **Professional breakdown** — Developer, Designer, Founder, Marketer, Creator, etc.
- **Location distribution** — parsed from bios and profile location fields
- **Bio keyword cloud** — most common terms across all bios
- **Follower size tiers** — 1K+, 5K+, 10K+, 25K+, 50K+, 100K+
- **Notable followers** — top 10 accounts by follower count
- **Audience vs Platform benchmarks** — your audience compared to X averages
- **Follower quality scoring** — Clean / Suspicious / Low Quality breakdown
- **Flagged accounts** — bot-like accounts with scores and reasons
- **Key insights** — auto-generated narrative analysis

## Spam report (`--spam`)

Dedicated view for cleaning up your followers:

- Quality breakdown (Clean / Suspicious / Low Quality)
- Every flagged account with a score (0-100) and reasons
- Detection signals: no bio, follow ratio, zero tweets, default avatar, auto-generated handles, spam keywords

## How it works

Uses [CLIX](https://github.com/spideystreet/clix) to fetch follower data via X's internal GraphQL API with automatic pagination. No official API key needed — just browser cookie auth.

Reports are hosted on [gui.new](https://gui.new) — HTML in, shareable URL out.

## License

MIT
