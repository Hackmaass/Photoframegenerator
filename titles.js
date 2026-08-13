/**
 * HH Goa 2026 — Builder Title Generator
 * Generates fun, memorable builder titles like "Chaos Compiler" or "Midnight Deployer"
 */

const ADJECTIVES = [
  'Midnight', 'Chaos', 'Quantum', 'Stealth', 'Zero-Day',
  'Hyper', 'Neural', 'Rogue', 'Atomic', 'Zen',
  'Infinite', 'Shadow', 'Turbo', 'Phantom', 'Crypto',
  'Laser', 'Neon', 'Pixel', 'Binary', 'Cosmic',
  'Savage', 'Silent', 'Rapid', 'Lucid', 'Feral',
  'Arcane', 'Mythic', 'Primal', 'Eternal', 'Volatile',
  'Omega', 'Alpha', 'Delta', 'Sigma', 'Ultra',
  'Stellar', 'Galactic', 'Sonic', 'Thunder', 'Blazing',
  'Supreme', 'Elite', 'Prime', 'Apex', 'Legendary',
  'Wild', 'Reckless', 'Fearless', 'Untamed', 'Relentless',
];

const NOUNS = [
  'Deployer', 'Compiler', 'Architect', 'Blacksmith', 'Wizard',
  'Whisperer', 'Hacker', 'Surgeon', 'Alchemist', 'Forger',
  'Wrangler', 'Conjurer', 'Sorcerer', 'Engineer', 'Navigator',
  'Crusader', 'Sentinel', 'Phantom', 'Pioneer', 'Maverick',
  'Operative', 'Tactician', 'Voyager', 'Catalyst', 'Visionary',
  'Shipper', 'Debugger', 'Builder', 'Crafter', 'Tinkerer',
  'Artisan', 'Overlord', 'Commander', 'Sage', 'Monk',
  'Ronin', 'Samurai', 'Gladiator', 'Ranger', 'Juggernaut',
];

const SPECIAL_TITLES = [
  'Bug Whisperer',
  'Prompt Engineer Supreme',
  'Chaos Compiler',
  'AI Blacksmith',
  'API Wizard',
  'Midnight Deployer',
  'Builder of Impossible Things',
  'Code Alchemist',
  'Stack Overflow Survivor',
  'Regex Sorcerer',
  'Git Conflict Resolver',
  'Memory Leak Hunter',
  'Pixel Perfect Artisan',
  'Cloud Native Nomad',
  'Terminal Ronin',
  'Full Stack Gladiator',
  'Neural Net Whisperer',
  'Open Source Ronin',
  'DevOps Samurai',
  'Kernel Panic Tamer',
  'Cache Invalidator',
  'Async Await Monk',
  'Docker Compose Sage',
  'Zero Downtime Architect',
  'Callback Hell Escapee',
  'Lambda Function Ninja',
  'Type Safety Guardian',
  'Infinite Loop Breaker',
  'Legacy Code Archaeologist',
  'Production Hotfix Hero',
  'Merge Conflict Mediator',
  'Database Whisperer',
  'Pixel Pusher Supreme',
  'Rubber Duck Debugger',
  'Ship-It Specialist',
  'LGTM Machine',
  'NaN Handler',
  'Syntax Error Sensei',
  'Dark Mode Evangelist',
  'Vim Exit Strategist',
];

/**
 * Simple hash function for deterministic seeding from a string
 */
function hashString(str) {
  let hash = 0;
  const s = str.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator (mulberry32)
 */
function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Generate a builder title from a name (deterministic)
 * @param {string} name - Builder's name for seeding
 * @returns {string} A fun builder title
 */
export function generateTitle(name) {
  if (!name || name.trim().length === 0) {
    return SPECIAL_TITLES[0];
  }

  const hash = hashString(name);
  const rand = seededRandom(hash);

  // 40% chance of a special title, 60% chance of adjective+noun combo
  if (rand < 0.4) {
    const index = Math.floor(seededRandom(hash + 1) * SPECIAL_TITLES.length);
    return SPECIAL_TITLES[index];
  }

  const adjIndex = Math.floor(seededRandom(hash + 2) * ADJECTIVES.length);
  const nounIndex = Math.floor(seededRandom(hash + 3) * NOUNS.length);
  return `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;
}

/**
 * Generate a random builder title (non-deterministic)
 * @returns {string} A random fun builder title
 */
export function generateRandomTitle() {
  const rand = Math.random();

  if (rand < 0.35) {
    const index = Math.floor(Math.random() * SPECIAL_TITLES.length);
    return SPECIAL_TITLES[index];
  }

  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
