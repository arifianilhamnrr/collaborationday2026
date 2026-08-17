PRAGMA foreign_keys = ON;

CREATE TABLE electronic_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE RESTRICT,
  receipt_number TEXT NOT NULL UNIQUE,
  object_key TEXT NOT NULL UNIQUE,
  amount_paid INTEGER NOT NULL CHECK (amount_paid >= 0),
  payment_method_label TEXT NOT NULL,
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped')),
  whatsapp_status TEXT NOT NULL DEFAULT 'pending' CHECK (whatsapp_status IN ('pending', 'sent', 'failed', 'skipped')),
  email_sent_at TEXT,
  whatsapp_sent_at TEXT,
  last_delivery_error TEXT
);

CREATE INDEX electronic_receipts_issued_idx ON electronic_receipts(issued_at DESC);
