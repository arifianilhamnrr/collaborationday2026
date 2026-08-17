PRAGMA foreign_keys = ON;

CREATE TABLE event_editions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL UNIQUE CHECK (year BETWEEN 2020 AND 2100),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  venue TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  registration_opens_at TEXT NOT NULL,
  registration_closes_at TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  ticket_amount INTEGER NOT NULL CHECK (ticket_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  hero_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('static_qris', 'bank_transfer')),
  label TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT,
  bank_name TEXT,
  qris_image_url TEXT,
  instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  CHECK (
    (type = 'static_qris' AND qris_image_url IS NOT NULL) OR
    (type = 'bank_transfer' AND account_name IS NOT NULL AND account_number IS NOT NULL AND bank_name IS NOT NULL)
  )
);

CREATE TABLE participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE RESTRICT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'payment_review', 'confirmed', 'rejected', 'cancelled')),
  amount_due INTEGER NOT NULL CHECK (amount_due >= 0),
  ticket_token_hash TEXT NOT NULL UNIQUE,
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TEXT,
  UNIQUE (edition_id, participant_id)
);

CREATE TABLE payment_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE RESTRICT,
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
  proof_object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewed_by TEXT,
  CHECK (status != 'rejected' OR rejection_reason IS NOT NULL)
);

CREATE TABLE galleries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  photographer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1))
);

CREATE INDEX registrations_edition_status_idx ON registrations(edition_id, status);
CREATE INDEX payment_submissions_status_idx ON payment_submissions(status, submitted_at);
CREATE INDEX galleries_edition_order_idx ON galleries(edition_id, sort_order);
