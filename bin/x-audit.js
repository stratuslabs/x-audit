#!/usr/bin/env node

import { program } from 'commander';
import { exec } from 'child_process';
import os from 'os';
import { scrape } from '../src/scraper.js';
import { analyze } from '../src/analyzer.js';
import { render, renderSpam } from '../src/renderer.js';
import { publish } from '../src/publisher.js';
import fs from 'fs';

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

program
  .name('x-audit')
  .description('Analyze any X/Twitter user\'s following list')
  .argument('<handle>', 'X/Twitter handle (with or without @)')
  .option('-l, --limit <n>', 'Max profiles to scrape (default: 1000)', (v) => parseInt(v, 10), 1000)
  .option('--mode <type>', 'followers or following (default: followers)', 'followers')
  .option('--json', 'Output raw JSON analysis')
  .option('--html <file>', 'Save HTML report locally')
  .option('--gui-key <key>', 'gui.new Pro API key for 30d expiry')
  .option('--spam', 'Show only low-quality/bot accounts')
  .option('--no-gui', 'Skip publishing to gui.new')
  .action(async (handle, opts) => {
    handle = handle.replace(/^@/, '');
    
    console.log(`\n🔍 x-audit — analyzing @${handle}'s network\n`);

    // Step 1: Scrape
    console.log('📡 Scraping following list...');
    let profiles;
    try {
      profiles = await scrape(handle, {
        limit: opts.limit || 1000,
        mode: opts.mode || 'followers',
      });
    } catch (err) {
      console.error(`\n❌ Scraping failed: ${err.message}`);
      process.exit(1);
    }
    console.log(`   Found ${profiles.length} profiles\n`);

    if (profiles.length === 0) {
      console.log('No profiles found. The account may be private or require authentication.');
      console.log('Run with --no-headless to log in interactively.');
      process.exit(1);
    }

    // Step 2: Analyze
    console.log('🧠 Analyzing bios...');
    const analysis = analyze(profiles, handle);

    if (opts.json) {
      console.log(JSON.stringify(opts.spam ? { quality: analysis.qualityBreakdown, flagged: analysis.flagged } : analysis, null, 2));
      return;
    }

    // Step 3: Render
    console.log('🎨 Generating report...');
    const html = opts.spam ? renderSpam(analysis) : render(analysis);

    if (opts.html) {
      fs.writeFileSync(opts.html, html);
      console.log(`   Saved to ${opts.html}`);
    }

    // Step 4: Publish
    if (opts.gui !== false) {
      console.log('🚀 Publishing to gui.new...');
      try {
        const url = await publish(html, handle, opts.guiKey);
        console.log(`\n✅ Done!\n`);
        console.log(`🔗 ${url}\n`);
        openUrl(url);
      } catch (err) {
        console.error(`\n⚠️  gui.new publish failed: ${err.message}`);
        const fallback = `${os.tmpdir()}/x-audit-${handle}.html`;
        fs.writeFileSync(fallback, html);
        console.log(`   Saved locally — opening in browser...\n`);
        openUrl(`file://${fallback}`);
      }
    } else {
      const fallback = opts.html || `${os.tmpdir()}/x-audit-${handle}.html`;
      if (!opts.html) fs.writeFileSync(fallback, html);
      console.log(`\n✅ Saved to ${fallback}\n`);
      openUrl(`file://${fallback}`);
    }
  });

await program.parseAsync();
