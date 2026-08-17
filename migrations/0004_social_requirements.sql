PRAGMA foreign_keys = ON;

ALTER TABLE event_editions ADD COLUMN capacity_unlimited INTEGER NOT NULL DEFAULT 0 CHECK (capacity_unlimited IN (0, 1));
ALTER TABLE event_editions ADD COLUMN map_embed_url TEXT;

CREATE TABLE social_follow_proofs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL UNIQUE REFERENCES participants(id) ON DELETE RESTRICT,
  collaboration_day_instagram_key TEXT NOT NULL UNIQUE,
  hmps_instagram_key TEXT NOT NULL UNIQUE,
  hmps_tiktok_key TEXT NOT NULL UNIQUE,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX social_follow_proofs_submitted_idx ON social_follow_proofs(submitted_at DESC);
