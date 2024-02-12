CREATE TABLE IF NOT EXISTS item
(
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  w INTEGER NOT NULL,
  h INTEGER NOT NULL,
  name VARCHAR(100),
  -- labels VARCHAR(100),
  stylesheet TEXT,
  -- content_type VARCHAR(10) NOT NULL
  -- content_length INTEGER NOT NULL
  schema TEXT
  -- user_space_id INTEGER,
  -- CONSTRAINT space FOREIGN KEY(user_space_id) REFERENCES user_space(id)
);

-- CREATE TABLE IF NOT EXISTS space
-- (
--   id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
--   x INTEGER NOT NULL,
--   y INTEGER NOT NULL,
--   w INTEGER NOT NULL,
--   h INTEGER NOT NULL,
--   permissions -- Permits a set of users to, read/write/ resize space, delete space
--   shared_with
-- );

-- CREATE TABLE IF NOT EXISTS user_space
-- (
--   space_id INTEGER references space(id), -- Problem arises when access is lost to this space
--   user_id INTEGER references user(id),
--   x INTEGER NOT NULL,
--   y INTEGER NOT NULL,
--   w INTEGER NOT NULL,
--   h INTEGER NOT NULL,
-- );

-- CREATE TABLE IF NOT EXISTS user
-- (
--   id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
--   email VARCHAR(100) NOT NULL
--   username VARCHAR(100) NOT NULL
--   password BLOB NOT NULL
-- );
