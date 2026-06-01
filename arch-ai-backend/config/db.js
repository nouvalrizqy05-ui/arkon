const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

/**
 * ARKON Database Pool Configuration
 * 
 * Mendukung 3 provider:
 * 1. Azure Database for PostgreSQL Flexible Server (via DATABASE_URL atau DB_HOST *.postgres.database.azure.com)
 * 2. Supabase Postgres (via DATABASE_URL atau DB_HOST *.supabase.co)
 * 3. Local / Docker Postgres
 * 
 * Azure khusus: WAJIB SSL dengan rejectUnauthorized: false karena Azure menggunakan
 * self-signed CA yang tidak ada di Node.js default trust store.
 */

const isAzure = !!(
  process.env.AZURE_POSTGRESQL_HOST ||
  process.env.DB_HOST?.includes('.postgres.database.azure.com') ||
  process.env.DATABASE_URL?.includes('.postgres.database.azure.com')
);

const isSupabase = !!(
  process.env.DB_HOST?.includes('supabase') ||
  process.env.DATABASE_URL?.includes('supabase')
);

// SSL config: Azure dan Supabase butuh SSL, local tidak
const sslConfig = (isAzure || isSupabase)
  ? { rejectUnauthorized: false }  // Azure: butuh SSL, tapi cert-nya self-signed
  : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false);

const commonConfig = {
  max: 10,
  idleTimeoutMillis: isAzure ? 10000 : 1000, // Azure lebih toleran dengan idle connections
  connectionTimeoutMillis: 30000,             // Azure cold start bisa lambat
  query_timeout: 20000,
  keepAlive: true,
};

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  try {
    const urlObj = new URL(databaseUrl);
    urlObj.searchParams.delete('sslmode');
    databaseUrl = urlObj.toString();
  } catch (err) {
    // Fallback to original if URL parsing fails
  }
}

const poolConfig = databaseUrl
  ? {
    connectionString: databaseUrl,
    ssl: sslConfig,
    ...commonConfig
  }
  : {
    host: process.env.AZURE_POSTGRESQL_HOST || process.env.DB_HOST,
    port: parseInt(process.env.AZURE_POSTGRESQL_PORT || process.env.DB_PORT) || 5432,
    database: process.env.AZURE_POSTGRESQL_DATABASE || process.env.DB_NAME,
    user: process.env.AZURE_POSTGRESQL_USER || process.env.DB_USER,
    password: process.env.AZURE_POSTGRESQL_PASSWORD || process.env.DB_PASSWORD,
    ssl: sslConfig,
    ...commonConfig
  };

if (isAzure) {
  console.log('☁️  [DB] Azure PostgreSQL Flexible Server detected — SSL enabled');
}

const pool = new Pool(poolConfig);

pool.on('connect', () => console.log('✅ [DB] Connected to PostgreSQL'));
pool.on('error', (err) => {
  console.error('❌ [DB] Unexpected error on idle client', err.message);
  // Jangan exit process — Azure/Supabase kadang drop connection, perlu reconnect
});

module.exports = pool;
