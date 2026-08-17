PRAGMA foreign_keys = ON;

CREATE TABLE admission_proofs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL UNIQUE REFERENCES participants(id) ON DELETE RESTRICT,
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX admission_proofs_submitted_idx ON admission_proofs(submitted_at DESC);
