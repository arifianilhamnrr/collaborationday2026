PRAGMA foreign_keys = ON;

ALTER TABLE participants ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
CREATE INDEX participants_gender_idx ON participants(gender, whatsapp_verified_at);
