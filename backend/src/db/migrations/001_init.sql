-- FinEdge initial schema. Money is NUMERIC(12,2); every user-owned row cascades
-- on user deletion. Categories are protected from deletion while transactions
-- reference them (ON DELETE RESTRICT); budgets follow their category (CASCADE).

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));

CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  type       VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);
CREATE INDEX categories_user_idx ON categories (user_id);

CREATE TABLE transactions (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id      INTEGER       NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type             VARCHAR(10)   NOT NULL CHECK (type IN ('income', 'expense')),
  description      VARCHAR(200)  NOT NULL DEFAULT '',
  transaction_date DATE          NOT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_date_idx ON transactions (user_id, transaction_date DESC);
CREATE INDEX transactions_category_idx ON transactions (category_id);

CREATE TABLE budgets (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER       NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  period      VARCHAR(10)   NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date  DATE          NOT NULL,
  end_date    DATE          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  UNIQUE (user_id, category_id, period, start_date)
);
CREATE INDEX budgets_user_idx ON budgets (user_id);
