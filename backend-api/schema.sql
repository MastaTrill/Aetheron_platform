-- Aetheron scalable database schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  wallet TEXT,
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  wallet TEXT,
  pair TEXT,
  amount NUMERIC,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  ref_code TEXT,
  referred_wallet TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
