CREATE TABLE item
(
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  w INTEGER NOT NULL,
  h INTEGER NOT NULL,
  name VARCHAR(100),
  schema TEXT
);