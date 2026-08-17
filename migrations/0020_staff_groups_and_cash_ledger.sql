PRAGMA foreign_keys = ON;

ALTER TABLE social_follow_proofs ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'));
ALTER TABLE social_follow_proofs ADD COLUMN reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE social_follow_proofs ADD COLUMN reviewed_at TEXT;
ALTER TABLE social_follow_proofs ADD COLUMN rejection_reason TEXT;

ALTER TABLE payment_submissions ADD COLUMN reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE staff_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('pendamping', 'bendahara')),
  full_name TEXT NOT NULL,
  phone_e164 TEXT UNIQUE,
  whatsapp_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participant_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pendamping_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  whatsapp_invite_url TEXT,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (edition_id, name),
  UNIQUE (edition_id, pendamping_user_id),
  UNIQUE (id, edition_id)
);

CREATE TABLE participant_group_memberships (
  group_id INTEGER NOT NULL,
  edition_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, participant_id),
  UNIQUE (edition_id, participant_id),
  FOREIGN KEY (group_id, edition_id) REFERENCES participant_groups(id, edition_id) ON DELETE CASCADE
);

CREATE TABLE cash_payment_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_submission_id INTEGER NOT NULL REFERENCES payment_submissions(id) ON DELETE RESTRICT,
  amount_received INTEGER NOT NULL CHECK (amount_received > 0),
  settlement_timing TEXT NOT NULL CHECK (settlement_timing IN ('paid', 'technical_meeting', 'event')),
  notes TEXT,
  recorded_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX social_follow_proofs_review_idx ON social_follow_proofs(status, submitted_at);
CREATE INDEX participant_groups_pendamping_idx ON participant_groups(pendamping_user_id, edition_id);
CREATE INDEX participant_group_memberships_participant_idx ON participant_group_memberships(participant_id, edition_id);
CREATE INDEX cash_payment_entries_submission_idx ON cash_payment_entries(payment_submission_id, recorded_at);
