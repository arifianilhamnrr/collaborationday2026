PRAGMA foreign_keys = ON;

ALTER TABLE galleries ADD COLUMN object_key TEXT;
ALTER TABLE galleries ADD COLUMN original_filename TEXT;
ALTER TABLE galleries ADD COLUMN size_bytes INTEGER;
ALTER TABLE galleries ADD COLUMN uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE galleries ADD COLUMN created_at TEXT;

UPDATE galleries SET created_at=CURRENT_TIMESTAMP WHERE created_at IS NULL;

CREATE UNIQUE INDEX galleries_object_key_idx ON galleries(object_key) WHERE object_key IS NOT NULL;
