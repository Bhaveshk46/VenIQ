/* global process */
/**
 * VenIQ — Live Crowd Simulation Backend Worker
 * Run with: npm run backend
 * 
 * This standalone Node.js script drives the real-time crowd simulation,
 * pushing live data to Firebase Realtime Database every 30 seconds.
 * It runs independently of the browser so data stays live 24/7.
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

// ─── Load Environment Variables (Process.env or .env) ──────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');
const envVars = { ...process.env }; // Start with system-level variables

try {
  const raw = readFileSync(envPath, 'utf8');
  raw.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      const k = key.trim();
      if (!envVars[k]) envVars[k] = rest.join('=').trim();
    }
  });
} catch {
  console.log('ℹ️ No .env file found. Relying on system environment variables.');
}

// ─── Firebase Config ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: envVars['VITE_FIREBASE_API_KEY'],
  authDomain: `${envVars['VITE_FIREBASE_PROJECT_ID']}.firebaseapp.com`,
  databaseURL: envVars['VITE_FIREBASE_DATABASE_URL'],
  projectId: envVars['VITE_FIREBASE_PROJECT_ID'],
};

if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
  console.error('❌ Firebase config missing in .env. Check VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_DATABASE_URL.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const matchRef = ref(db, 'match');
const crowdLevelsRef = ref(db, 'crowdLevels');
const feedRef = ref(db, 'feed');

// ─── Zone Definitions ──────────────────────────────────────────────────────────
const ZONES = [
  { id: 'gate_north', type: 'gate' },
  { id: 'gate_south', type: 'gate' },
  { id: 'shops_north', type: 'food' },
  { id: 'shops_south', type: 'food' },
  { id: 'rest_w', type: 'restroom' },
  { id: 'rest_e', type: 'restroom' },
  { id: 'first_aid', type: 'aid' },
  { id: 'first_aid_2', type: 'aid' },
  { id: 'merch', type: 'merch' },
  { id: 'block_a', type: 'seat' },
  { id: 'block_b', type: 'seat' },
  { id: 'block_c', type: 'seat' },
  { id: 'block_d', type: 'seat' },
  { id: 'block_e', type: 'seat' },
  { id: 'block_f', type: 'seat' },
  { id: 'block_g', type: 'seat' },
  { id: 'block_h', type: 'seat' },
];

// ─── Crowd Logic ───────────────────────────────────────────────────────────────
function getCrowdLevel(time, zoneType) {
  if (time < 10 || time > 85) {
    if (zoneType === 'gate') return 'red';
    return 'green';
  }
  if (time >= 40 && time <= 55) {
    if (zoneType === 'food' || zoneType === 'restroom') return 'red';
    return 'green';
  }
  if (time > 15 && time < 40) {
    if (zoneType === 'food') return 'amber';
    return 'green';
  }
  return 'green';
}

// ─── Simulation Loop ───────────────────────────────────────────────────────────
let currentTime = 0;

async function tick() {
  currentTime = (currentTime + 1) % 95;

  const status = currentTime < 45 ? '1st Half' : (currentTime < 55 ? 'Halftime' : '2nd Half');
  const newCrowdLevels = {};

  ZONES.forEach(zone => {
    newCrowdLevels[zone.id] = getCrowdLevel(currentTime, zone.type);
  });

  try {
    await set(matchRef, { time: currentTime, status });
    await set(crowdLevelsRef, newCrowdLevels);

    if (currentTime % 15 === 0) {
      await push(feedRef, {
        text: `Match minute ${currentTime}: ${status}. Check crowd levels before moving!`,
        timestamp: Date.now(),
        timeLabel: `${currentTime}m`
      });
    }

    console.log(`✅ [${new Date().toLocaleTimeString()}] Tick ${currentTime}m — ${status}`);
  } catch (err) {
    console.error('❌ Firebase write failed:', err.message);
  }
}

// ─── Cloud Run Health Check Server ─────────────────────────────────────────────
// Cloud Run requires the container to listen on a port (8080) to stay active.
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('VenIQ Worker is Healthy\n');
}).listen(PORT, () => {
  console.log(`📡 Health check server listening on port ${PORT}`);
});

// Run immediately on start, then every 30 seconds
tick();
setInterval(tick, 30000);

console.log('🏟️  VenIQ Simulation Backend is LIVE. Updating every 30s...');
console.log('   Press Ctrl+C to stop.\n');
