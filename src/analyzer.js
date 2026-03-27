const CATEGORIES = {
  'Developer': ['developer', 'engineer', 'software', 'frontend', 'backend', 'fullstack', 'full-stack', 'devops', 'sre', 'programmer', 'coding', 'web dev', 'ios dev', 'android dev', 'data engineer', 'ml engineer'],
  'Designer': ['designer', 'design', 'ux', 'ui', 'creative director', 'art director', 'illustrator', 'graphic', 'brand designer', 'product design'],
  'Founder/CEO': ['founder', 'ceo', 'co-founder', 'cofounder', 'built', 'building', 'bootstrapped', 'startup', 'started', 'serial entrepreneur'],
  'Product': ['product manager', 'product lead', 'pm at', 'head of product', 'vp product', 'cpo'],
  'Marketer': ['marketer', 'marketing', 'growth', 'seo', 'content', 'copywriter', 'brand', 'cmo', 'demand gen', 'performance marketing'],
  'Creator': ['creator', 'youtuber', 'streamer', 'podcaster', 'newsletter', 'blogger', 'influencer', 'content creator'],
  'Writer': ['writer', 'author', 'writing', 'journalist', 'editor', 'columnist', 'novelist', 'poet'],
  'Investor': ['investor', 'vc', 'venture', 'angel', 'investing', 'capital', 'fund', 'portfolio'],
  'AI/ML': ['ai', 'machine learning', 'deep learning', 'llm', 'gpt', 'neural', 'artificial intelligence', 'nlp', 'computer vision'],
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'that', 'this',
  'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'about', 'above', 'after', 'again', 'also',
  'am', 'as', 'if', 'into', 'new', 'now', 'out', 'then', 'there',
  'up', 'us', 'via', 'get', 'got', 'like', 'love', 'make', 'one',
  'over', 'im', "i'm", 'here', '&', '|', '-', '—', '•', '→', '/',
]);

const LOCATION_PATTERNS = [
  /📍\s*(.+?)(?:\s*[|•·—\n]|$)/i,
  /(?:based in|living in|from|located in|residing in)\s+(.+?)(?:\s*[|•·—.\n]|$)/i,
  /🌍\s*(.+?)(?:\s*[|•·—\n]|$)/i,
  /🇺🇸|🇬🇧|🇨🇦|🇦🇺|🇩🇪|🇫🇷|🇯🇵|🇮🇳|🇧🇷|🇳🇱/u,
];

const KNOWN_LOCATIONS = [
  'san francisco', 'nyc', 'new york', 'london', 'berlin', 'paris',
  'los angeles', 'seattle', 'austin', 'toronto', 'miami', 'boston',
  'chicago', 'denver', 'portland', 'amsterdam', 'singapore', 'tokyo',
  'bangalore', 'mumbai', 'dubai', 'lisbon', 'remote', 'worldwide',
  'bay area', 'silicon valley', 'brooklyn', 'manhattan', 'oakland',
  'vancouver', 'melbourne', 'sydney', 'atlanta', 'nashville', 'sarasota',
];

function categorize(bio) {
  if (!bio) return ['Other'];
  const lower = bio.toLowerCase();
  const matched = [];
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.push(category);
        break;
      }
    }
  }
  
  return matched.length > 0 ? matched : ['Other'];
}

function extractLocation(bio) {
  if (!bio) return null;
  
  // Check patterns
  for (const pattern of LOCATION_PATTERNS) {
    const match = bio.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 30);
    }
  }
  
  // Check known locations
  const lower = bio.toLowerCase();
  for (const loc of KNOWN_LOCATIONS) {
    if (lower.includes(loc)) {
      return loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }
  
  return null;
}

function extractKeywords(bios) {
  const freq = {};
  
  for (const bio of bios) {
    if (!bio) continue;
    const words = bio.toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
    
    const seen = new Set();
    for (const word of words) {
      if (!seen.has(word)) {
        freq[word] = (freq[word] || 0) + 1;
        seen.add(word);
      }
    }
  }
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([word, count]) => ({ word, count }));
}

export function analyze(profiles, handle) {
  const total = profiles.length;
  
  // Categories
  const categoryCount = {};
  for (const p of profiles) {
    const cats = categorize(p.bio);
    for (const cat of cats) {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }
  
  const categories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  
  // Verified
  const verifiedCount = profiles.filter(p => p.verified).length;
  
  // Locations
  const locationCount = {};
  for (const p of profiles) {
    const loc = extractLocation(p.bio);
    if (loc) {
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    }
  }
  
  const locations = Object.entries(locationCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  
  const locationsDetected = Object.values(locationCount).reduce((a, b) => a + b, 0);
  
  // Keywords
  const keywords = extractKeywords(profiles.map(p => p.bio));
  
  // Bios with content
  const hasBio = profiles.filter(p => p.bio && p.bio.length > 5).length;

  // Follower tiers (only if we have follower count data)
  const thresholds = [1000, 5000, 10000, 25000, 50000, 100000];
  const followerTiers = [];
  const profilesWithCount = profiles.filter(p => p.followersCount != null && p.followersCount > 0);
  
  if (profilesWithCount.length > 0) {
    for (const t of thresholds) {
      const count = profilesWithCount.filter(p => p.followersCount >= t).length;
      followerTiers.push({
        threshold: t >= 1000 ? `${t / 1000}K+` : `${t}+`,
        count,
        pct: ((count / total) * 100).toFixed(1),
      });
    }
  }

  // Notable followers (top by follower count)
  const notable = [...profiles]
    .filter(p => p.followersCount != null && p.followersCount > 0)
    .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
    .slice(0, 10)
    .map(p => ({
      handle: p.handle,
      displayName: p.displayName,
      followersCount: p.followersCount,
      bio: (p.bio || '').substring(0, 80),
      verified: p.verified,
    }));

  // Bot / low quality scoring
  const botScores = [];
  for (const p of profiles) {
    let score = 0;
    const reasons = [];

    // No bio
    if (!p.bio || p.bio.length < 5) { score += 25; reasons.push('No bio'); }
    
    // Following/follower ratio way off (following tons, very few followers)
    const fc = p.followersCount || 0;
    const fing = p.followingCount || 0;
    if (fing > 500 && fc < 20) { score += 30; reasons.push(`Following ${fing.toLocaleString()}, only ${fc} followers`); }
    else if (fing > 1000 && fc > 0 && fing / fc > 50) { score += 25; reasons.push(`Following/follower ratio: ${Math.round(fing / fc)}:1`); }
    else if (fing > 500 && fc > 0 && fing / fc > 20) { score += 15; reasons.push(`High follow ratio: ${Math.round(fing / fc)}:1`); }
    
    // Zero tweets
    if (p.tweetCount !== undefined && p.tweetCount === 0) { score += 20; reasons.push('Zero tweets'); }
    else if (p.tweetCount !== undefined && p.tweetCount < 5) { score += 10; reasons.push(`Only ${p.tweetCount} tweets`); }
    
    // Default profile image
    if (p.profileImageUrl?.includes('default_profile')) { score += 20; reasons.push('Default avatar'); }
    
    // Random handle pattern (lots of numbers at end)
    if (/\d{6,}/.test(p.handle)) { score += 15; reasons.push('Auto-generated handle'); }
    
    // Spam bio keywords
    const bioLower = (p.bio || '').toLowerCase();
    const spamKeywords = ['follow back', 'follow me', 'dm me', 'follow 4 follow', 'f4f', '18+', 'onlyfans', 'cashapp', '$cashtag'];
    for (const kw of spamKeywords) {
      if (bioLower.includes(kw)) { score += 15; reasons.push(`Bio contains "${kw}"`); break; }
    }
    
    // Very new account (no created_at data from CLIX by default, skip if not available)
    
    botScores.push({
      handle: p.handle,
      displayName: p.displayName,
      score: Math.min(score, 100),
      reasons,
      followersCount: fc,
      followingCount: fing,
      bio: (p.bio || '').substring(0, 60),
      verified: p.verified,
    });
  }
  
  // Sort by score descending
  const flagged = botScores.filter(b => b.score >= 40).sort((a, b) => b.score - a.score);
  const suspicious = botScores.filter(b => b.score >= 25 && b.score < 40).length;
  const clean = botScores.filter(b => b.score < 25).length;
  
  const qualityBreakdown = {
    clean: { count: clean, pct: Math.round((clean / total) * 100) },
    suspicious: { count: suspicious, pct: Math.round((suspicious / total) * 100) },
    lowQuality: { count: flagged.length, pct: Math.round((flagged.length / total) * 100) },
  };

  // Platform benchmarks (X/Twitter averages for context)
  const benchmarks = [];
  const designerPct = categories.find(c => c.name === 'Designer')?.pct || 0;
  const devPct = categories.find(c => c.name === 'Developer')?.pct || 0;
  const founderPct = categories.find(c => c.name === 'Founder/CEO')?.pct || 0;
  const investorPct = categories.find(c => c.name === 'Investor')?.pct || 0;
  const aiPct = categories.find(c => c.name === 'AI/ML')?.pct || 0;
  
  if (designerPct > 2) benchmarks.push({ metric: 'Designers', yours: `${designerPct}%`, platform: '~2%', delta: `${(designerPct / 2).toFixed(1)}x higher` });
  if (devPct > 2) benchmarks.push({ metric: 'Developers / Engineers', yours: `${devPct}%`, platform: '~4%', delta: `${(devPct / 4).toFixed(1)}x higher` });
  if (founderPct > 2) benchmarks.push({ metric: 'Founders / CEOs', yours: `${founderPct}%`, platform: '~1.5%', delta: `${(founderPct / 1.5).toFixed(1)}x higher` });
  if (investorPct > 1) benchmarks.push({ metric: 'Investors / VCs', yours: `${investorPct}%`, platform: '~0.5%', delta: `${(investorPct / 0.5).toFixed(1)}x higher` });
  if (aiPct > 2) benchmarks.push({ metric: 'AI / ML', yours: `${aiPct}%`, platform: '~1%', delta: `${(aiPct / 1).toFixed(1)}x higher` });
  
  const bioPct = Math.round((hasBio / total) * 100);
  benchmarks.push({ metric: 'Has a bio', yours: `${bioPct}%`, platform: '~35%', delta: bioPct > 35 ? `${(bioPct / 35).toFixed(1)}x higher` : 'below avg' });
  benchmarks.push({ metric: 'Verified accounts', yours: `${Math.round((verifiedCount / total) * 100)}%`, platform: '~2%', delta: `${(Math.round((verifiedCount / total) * 100) / 2).toFixed(1)}x higher` });
  
  if (locationsDetected > 0) {
    const locPct = Math.round((locationsDetected / total) * 100);
    benchmarks.push({ metric: 'Location in bio', yours: `${locPct}%`, platform: '~25%', delta: locPct > 25 ? `${(locPct / 25).toFixed(1)}x higher` : 'below avg' });
  }

  // Generate insights
  const insights = [];
  const topCat = categories.find(c => c.name !== 'Other');
  if (topCat && topCat.pct > 3) {
    insights.push(`Your audience skews heavily ${topCat.name} — ${topCat.pct}% of your followers identify as ${topCat.name} in their bio.`);
  }
  if (followerTiers.length > 0) {
    const tier1k = followerTiers.find(t => t.threshold === '1K+');
    const tier100k = followerTiers.find(t => t.threshold === '100K+');
    if (tier1k && parseFloat(tier1k.pct) > 15) {
      insights.push(`${tier1k.pct}% of your followers have 1K+ followers themselves — that's a high-quality, high-reach audience.`);
    }
    if (tier100k && tier100k.count > 10) {
      insights.push(`You have ${tier100k.count} followers with 100K+ followers. For a ~${(total / 1000).toFixed(1)}K account, that's unusually strong.`);
    }
  }
  if (locations.length > 0) {
    const topLocs = locations.slice(0, 3).map(l => l.name).join(', ');
    insights.push(`Top 3 locations: ${topLocs}. ${locationsDetected > 0 ? `${Math.round((locationsDetected / total) * 100)}% of bios mention a location.` : ''}`);
  }

  return {
    handle,
    total,
    verified: {
      count: verifiedCount,
      pct: Math.round((verifiedCount / total) * 100),
    },
    hasBio: {
      count: hasBio,
      pct: Math.round((hasBio / total) * 100),
    },
    locationsDetected: {
      count: locationsDetected,
      pct: Math.round((locationsDetected / total) * 100),
    },
    categories,
    locations,
    keywords,
    followerTiers,
    notable,
    benchmarks,
    qualityBreakdown,
    flagged,
    insights,
    generatedAt: new Date().toISOString(),
  };
}
