export function render(analysis) {
  const { handle, total, verified, hasBio, locationsDetected, categories, locations, keywords, followerTiers = [], notable = [], insights = [], generatedAt } = analysis;
  
  const topCategory = categories.find(c => c.name !== 'Other') || categories[0];
  const topLocation = locations[0];
  const date = new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Category bars
  const maxCatPct = categories[0]?.pct || 1;
  const categoryBars = categories.slice(0, 20).map(c => {
    const barWidth = Math.round((c.pct / maxCatPct) * 100);
    const colors = {
      'Developer': '#3b82f6',
      'Designer': '#a855f7', 
      'Founder/CEO': '#f59e0b',
      'Product': '#06b6d4',
      'Marketer': '#10b981',
      'Creator': '#ec4899',
      'Writer': '#8b5cf6',
      'Investor': '#f97316',
      'AI/ML': '#14b8a6',
      'E-commerce / DTC': '#f472b6',
      'E-commerce / DTC / Brand': '#f472b6',
      'Art / Artist': '#c084fc',
      'Artist': '#c084fc',
      'Crypto / Web3': '#22d3ee',
      'Crypto / Web3 / Blockchain': '#22d3ee',
      'Photographer': '#fbbf24',
      'Photographer / Videographer': '#fbbf24',
      'Music': '#fb923c',
      'Music / Musician': '#fb923c',
      'Journalist': '#a3e635',
      'Journalist / Reporter': '#a3e635',
      'Agency': '#94a3b8',
      'Agency / Studio Owner': '#94a3b8',
      'Design / Designer': '#a855f7',
      'Founder / Co-founder': '#f59e0b',
      'Developer / Engineer': '#3b82f6',
      'Product / Product Manager': '#06b6d4',
      'Marketing / Marketer': '#10b981',
      'CEO': '#ef4444',
      'Writer / Author': '#8b5cf6',
      'Investor / VC': '#f97316',
      'Creator / Content Creator': '#ec4899',
      'SaaS / Startup': '#818cf8',
      'Freelancer / Consultant': '#34d399',
      'Finance / Fintech': '#fbbf24',
      'Other': '#6b7280',
    };
    const color = colors[c.name] || '#6b7280';
    return `
      <div class="bar-row">
        <div class="bar-label">${c.name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${Math.max(barWidth, 4)}%; background: ${color}"></div>
        </div>
        <div class="bar-value">${c.pct}%</div>
      </div>`;
  }).join('');

  // Location bars
  const locationBars = locations.slice(0, 8).map((l, i) => {
    const maxCount = locations[0]?.count || 1;
    const width = Math.round((l.count / maxCount) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label">${l.name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${Math.max(width, 4)}%; background: #3b82f6; opacity: ${1 - i * 0.08}"></div>
        </div>
        <div class="bar-value">${l.count}</div>
      </div>`;
  }).join('');

  // Word cloud
  const maxKw = keywords[0]?.count || 1;
  const wordCloud = keywords.slice(0, 30).map(kw => {
    const size = 0.7 + (kw.count / maxKw) * 1.6;
    const opacity = 0.4 + (kw.count / maxKw) * 0.6;
    return `<span class="kw" style="font-size: ${size}rem; opacity: ${opacity}">${kw.word}</span>`;
  }).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@${handle}'s X Network — x-audit</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    background: #09090b;
    color: #fafafa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    line-height: 1.5;
    min-height: 100vh;
    padding: 2rem;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  /* Header */
  .header {
    text-align: center;
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #27272a;
  }
  
  .header h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
  }
  
  .header h1 span {
    background: linear-gradient(135deg, #3b82f6, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .header .subtitle {
    color: #71717a;
    font-size: 0.875rem;
  }
  
  /* Summary Cards */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  
  .card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 1.25rem;
  }
  
  .card .card-label {
    font-size: 0.75rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .card .card-value {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  
  .card .card-detail {
    font-size: 0.8rem;
    color: #a1a1aa;
    margin-top: 0.25rem;
  }
  
  /* Sections */
  .section {
    margin-bottom: 2.5rem;
  }
  
  .section h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .section h2 .icon {
    font-size: 1.25rem;
  }
  
  /* Bar Chart */
  .bar-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
  }
  
  .bar-label {
    width: 110px;
    font-size: 0.85rem;
    color: #d4d4d8;
    flex-shrink: 0;
    text-align: right;
  }
  
  .bar-track {
    flex: 1;
    height: 24px;
    background: #18181b;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.5s ease;
    min-width: 4px;
  }
  
  .bar-value {
    width: 40px;
    font-size: 0.85rem;
    color: #a1a1aa;
    text-align: right;
    flex-shrink: 0;
  }
  
  /* Keywords */
  .keyword-cloud {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 1.5rem;
    line-height: 2.2;
    text-align: center;
  }
  
  .kw {
    display: inline-block;
    margin: 0.15rem 0.4rem;
    color: #d4d4d8;
    transition: color 0.2s;
  }
  
  .kw:hover {
    color: #3b82f6;
  }
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #27272a;
    color: #52525b;
    font-size: 0.8rem;
  }
  
  .footer a {
    color: #3b82f6;
    text-decoration: none;
  }
  
  .footer a:hover {
    text-decoration: underline;
  }

  .powered {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-size: 0.75rem;
    color: #a1a1aa;
    margin-bottom: 0.75rem;
  }

  .powered strong {
    color: #fafafa;
  }

  /* Empty state */
  .empty {
    color: #52525b;
    font-size: 0.9rem;
    text-align: center;
    padding: 2rem;
  }

  @media (max-width: 600px) {
    body { padding: 1rem; }
    .header h1 { font-size: 1.5rem; }
    .bar-label { width: 80px; font-size: 0.75rem; }
    .cards { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
<div class="container">
  
  <div class="header">
    <h1><span>@${handle}</span>'s Network</h1>
    <div class="subtitle">${total} accounts analyzed · ${date}</div>
  </div>

  <div class="cards">
    <div class="card">
      <div class="card-label">Following</div>
      <div class="card-value">${total.toLocaleString()}</div>
      <div class="card-detail">profiles analyzed</div>
    </div>
    <div class="card">
      <div class="card-label">Top Category</div>
      <div class="card-value">${topCategory?.pct || 0}%</div>
      <div class="card-detail">${topCategory?.name || 'N/A'}</div>
    </div>
    <div class="card">
      <div class="card-label">Verified</div>
      <div class="card-value">${verified.pct}%</div>
      <div class="card-detail">${verified.count} accounts</div>
    </div>
    <div class="card">
      <div class="card-label">Has Bio</div>
      <div class="card-value">${hasBio.pct}%</div>
      <div class="card-detail">${hasBio.count} with bios</div>
    </div>
  </div>

  <div class="section">
    <h2><span class="icon">💼</span> Professional Breakdown</h2>
    ${categoryBars || '<div class="empty">No data</div>'}
  </div>

  ${locations.length > 0 ? `
  <div class="section">
    <h2><span class="icon">📍</span> Locations</h2>
    <div style="margin-bottom: 0.75rem; font-size: 0.8rem; color: #71717a;">
      ${locationsDetected.pct}% of bios mention a location
    </div>
    ${locationBars}
  </div>
  ` : ''}

  ${keywords.length > 0 ? `
  <div class="section">
    <h2><span class="icon">🏷️</span> Bio Keywords</h2>
    <div class="keyword-cloud">
      ${wordCloud}
    </div>
  </div>
  ` : ''}

  ${followerTiers.length > 0 ? `
  <div class="section">
    <h2><span class="icon">📊</span> Follower Size Distribution</h2>
    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid #27272a;">
            <th style="text-align: left; padding: 0.75rem 1rem; color: #71717a; font-weight: 500;">Threshold</th>
            <th style="text-align: right; padding: 0.75rem 1rem; color: #71717a; font-weight: 500;">Count</th>
            <th style="text-align: right; padding: 0.75rem 1rem; color: #71717a; font-weight: 500;">% of Followers</th>
          </tr>
        </thead>
        <tbody>
          ${followerTiers.map(t => `
          <tr style="border-bottom: 1px solid #1e1e21;">
            <td style="padding: 0.6rem 1rem; color: #fafafa; font-weight: 500;">${t.threshold}</td>
            <td style="text-align: right; padding: 0.6rem 1rem; color: #d4d4d8;">${t.count.toLocaleString()}</td>
            <td style="text-align: right; padding: 0.6rem 1rem; color: #3b82f6; font-weight: 500;">${t.pct}%</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  ${notable.length > 0 ? `
  <div class="section">
    <h2><span class="icon">⭐</span> Notable Followers</h2>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      ${notable.map((n, i) => `
      <div style="display: flex; align-items: center; gap: 0.75rem; background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 0.75rem 1rem;">
        <div style="color: #52525b; font-size: 0.75rem; width: 20px; text-align: center;">${i + 1}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-weight: 600; color: #fafafa;">@${n.handle}</span>
            ${n.verified ? '<span style="color: #3b82f6;">✓</span>' : ''}
            <span style="color: #52525b; font-size: 0.75rem;">${(n.followersCount >= 1000000 ? (n.followersCount / 1000000).toFixed(1) + 'M' : n.followersCount >= 1000 ? (n.followersCount / 1000).toFixed(1) + 'K' : n.followersCount)} followers</span>
          </div>
          ${n.bio ? `<div style="color: #71717a; font-size: 0.8rem; margin-top: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${n.bio}</div>` : ''}
        </div>
      </div>`).join('')}
    </div>
  </div>
  ` : ''}

  ${insights.length > 0 ? `
  <div class="section">
    <h2><span class="icon">💡</span> Key Insights</h2>
    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 1.25rem;">
      ${insights.map(ins => `
      <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem; align-items: flex-start;">
        <span style="color: #3b82f6; flex-shrink: 0;">→</span>
        <span style="color: #d4d4d8; font-size: 0.875rem; line-height: 1.5;">${ins}</span>
      </div>`).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="powered">
      Report by <strong>x-audit</strong> · Hosted on <a href="https://gui.new" target="_blank"><strong>gui.new</strong></a>
    </div>
    <div>
      <a href="https://github.com/stratuslabs/x-audit" target="_blank">github.com/stratuslabs/x-audit</a>
      · Generated ${date}
    </div>
  </div>

</div>
</body>
</html>`;
}
