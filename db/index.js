const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

// Let pg-connection-string interpret sslmode from DATABASE_URL.
// Local PostgreSQL URLs without sslmode can connect without TLS; hosted
// providers such as Neon can keep sslmode=require in DATABASE_URL.
const pool = new Pool({
  connectionString
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
