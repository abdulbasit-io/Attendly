const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

// Route Postgres traffic over WebSockets (port 443) instead of port 5432
// Required when port 5432 is blocked by the network
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
