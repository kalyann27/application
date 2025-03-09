import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure pool with SSL and proper timeouts
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon's SSL
  },
  max: 1, // Reduced to minimum for testing
  connectionTimeoutMillis: 0, // Wait indefinitely
  idleTimeoutMillis: 0,
  allowExitOnIdle: true
});

export const db = drizzle(pool, { schema });

// Enhanced connection status check with retry logic
export const getDatabaseStatus = async () => {
  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT 1');
      console.log('Database connection successful');
      return { 
        isConnected: true, 
        error: null,
        details: `Connected successfully: ${result.rowCount} row(s)` 
      };
    } catch (error: any) {
      console.error(`Database connection attempt failed (${retries} retries left):`, error);
      lastError = error;
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  console.error('All database connection attempts failed:', lastError);
  return { 
    isConnected: false, 
    error: lastError?.message,
    details: lastError?.stack 
  };
};

// Initialize database connection with error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Log error but don't exit
  console.error('Database connection error, attempting to recover');
});

// Add connect event handler
pool.on('connect', () => {
  console.log('New database connection established');
});