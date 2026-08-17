PRAGMA foreign_keys = ON;

CREATE TABLE event_rundown (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_benefits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request_rate_limits (
  scope TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (scope, fingerprint_hash)
);

CREATE INDEX event_rundown_edition_order_idx ON event_rundown(edition_id, sort_order);
CREATE INDEX event_benefits_edition_order_idx ON event_benefits(edition_id, sort_order);
CREATE INDEX event_faqs_edition_order_idx ON event_faqs(edition_id, sort_order);
