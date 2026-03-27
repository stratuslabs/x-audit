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
  'san francisco', 'sf', 'nyc', 'new york', 'london', 'berlin', 'paris',
  'los angeles', 'la', 'seattle', 'austin', 'toronto', 'miami', 'boston',
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
    generatedAt: new Date().toISOString(),
  };
}
