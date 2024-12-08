CREATE TABLE IF NOT EXISTS item
(
  id SERIAL PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  w INTEGER NOT NULL,
  h INTEGER NOT NULL,
  name VARCHAR(100),
  mime VARCHAR(100) NOT NULL,
  schema TEXT,
  file BYTEA
);
