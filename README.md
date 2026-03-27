# x-audit

Analyze any X/Twitter account's followers. One command → beautiful shareable report.

```bash
npx x-audit @username
```

## What it does

1. Fetches up to 1,000 followers via [CLIX](https://github.com/spideystreet/clix) (no API key needed)
2. Analyzes bios — professional categories, locations, follower tiers, keywords
3. Benchmarks your audience against X platform averages
4. Generates a polished dark-mode dashboard
5. Publishes to [gui.new](https://gui.new) — shareable link in seconds

## Prerequisites

[CLIX](https://github.com/spideystreet/clix) must be installed and authenticated:

```bash
uv pip install clix0
clix auth login --browser chrome
```

## Install

```bash
# Run directly from GitHub
npx github:stratuslabs/x-audit @username

# Or clone and run
git clone https://github.com/stratuslabs/x-audit.git
cd x-audit && npm install
node bin/x-audit.js @username
```

## Options

```
Usage: x-audit [options] <handle>

Options:
  -l, --limit <n>      Max profiles to scrape (default: 1000)
  --mode <type>        followers or following (default: followers)
  --json               Output raw JSON analysis
  --html <file>        Save HTML report locally
  --gui-key <key>      gui.new Pro API key for 30d expiry
  --no-gui             Skip publishing to gui.new
  -h, --help           Show help
```

## What's in the report

- **Summary cards** — total analyzed, top category, verified %, bio coverage
- **Professional breakdown** — Developer, Designer, Founder, Marketer, Creator, etc.
- **Location distribution** — parsed from bios and profile location fields
- **Bio keyword cloud** — most common terms across all bios
- **Follower size tiers** — 1K+, 5K+, 10K+, 25K+, 50K+, 100K+
- **Notable followers** — top 10 accounts by follower count
- **Audience vs Platform benchmarks** — your audience compared to X averages
- **Key insights** — auto-generated narrative analysis

## How it works

Uses [CLIX](https://github.com/spideystreet/clix) to fetch follower data via X's internal GraphQL API with automatic pagination. No official API key needed — just browser cookie auth.

Reports are hosted on [gui.new](https://gui.new) — HTML in, shareable URL out.

## License

MIT
