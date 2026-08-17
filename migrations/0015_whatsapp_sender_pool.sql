PRAGMA foreign_keys = ON;

CREATE TABLE whatsapp_sender_pool (
  session_id TEXT PRIMARY KEY,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE whatsapp_round_robin_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cursor INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO whatsapp_round_robin_state (id, cursor) VALUES (1, 0);
