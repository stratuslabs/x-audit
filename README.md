# x-audit

Analyze any X/Twitter user's following list. One command → beautiful shareable report.

```bash
npx x-audit @dylanfeltus
```

## What it does

1. Scrapes the target user's following list via browser automation
2. Analyzes bios — professional categories, locations, keywords, verified status
3. Generates a polished dark-mode dashboard
4. Publishes to [gui.new](https://gui.new) and gives you a shareable link

No X/Twitter API key needed. No paid tier required.

## Install

```bash
# Zero install — just run it
npx x-audit @username

# Or install globally
npm install -g x-audit
x-audit @username
```

## Options

```
Usage: x-audit [options] <handle>

Options:
  -l, --limit <n>     Max profiles to scrape (default: 500)
  --json              Output raw JSON analysis
  --html <file>       Save HTML report locally
  --gui-key <key>     gui.new Pro API key for 30d expiry
  --no-headless       Show browser window
  --no-gui            Skip publishing to gui.new
  -h, --help          Show help
```

## Authentication

X requires login to view following lists. On first run, a browser window opens — log in once, and your session is saved to `~/.x-audit/cookies.json` for future runs.

## What's in the report

- **Summary cards** — total analyzed, top category, verified %, bio coverage
- **Professional breakdown** — Developer, Designer, Founder, Marketer, Creator, etc.
- **Location distribution** — parsed from bios (📍, "Based in", etc.)
- **Bio keyword cloud** — most common terms across all bios

## How it works

Uses [Playwright](https://playwright.dev/) to scroll through X's following page and extract profile data from rendered DOM elements. No API keys, no scraping services — just a headless browser doing what you'd do manually.

Reports are hosted on [gui.new](https://gui.new) — HTML in, shareable URL out.

## License

MIT
