/**
 * VenIQ — Live Crowd Simulation Backend Worker (Mocked)
 * Run with: npm run backend
 * 
 * Firebase has been temporarily removed.
 * This worker will now just run the health check server.
 */

import http from 'http';

// ─── Cloud Run Health Check Server ─────────────────────────────────────────────
// Cloud Run requires the container to listen on a port (8080) to stay active.
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('VenIQ Worker is Healthy (Firebase Mocked)\n');
}).listen(PORT, () => {
  console.log(`📡 Health check server listening on port ${PORT}`);
});

console.log('🏟️  VenIQ Simulation Backend is running in MOCK mode (Firebase disabled).');
console.log('   Press Ctrl+C to stop.\n');

