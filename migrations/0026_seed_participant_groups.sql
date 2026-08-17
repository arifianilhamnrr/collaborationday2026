PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS participant_groups_require_pendamping_insert;
DROP TRIGGER IF EXISTS participant_groups_require_pendamping_update;
DROP TRIGGER IF EXISTS staff_profiles_keep_assigned_pendamping_role;
DROP TRIGGER IF EXISTS staff_profiles_keep_assigned_pendamping;
DROP TRIGGER IF EXISTS users_keep_assigned_pendamping_role;

CREATE TABLE participant_groups_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pendamping_user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  whatsapp_invite_url TEXT,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (edition_id, name),
  UNIQUE (edition_id, pendamping_user_id),
  UNIQUE (id, edition_id)
);

INSERT INTO participant_groups_new (id, edition_id, name, pendamping_user_id, whatsapp_invite_url, created_by_user_id, created_at, updated_at)
SELECT id, edition_id, name, pendamping_user_id, whatsapp_invite_url, created_by_user_id, created_at, updated_at
FROM participant_groups;

CREATE TABLE participant_group_memberships_backup AS
SELECT group_id, edition_id, participant_id, assigned_by_user_id, assigned_at
FROM participant_group_memberships;

DROP TABLE participant_group_memberships;
DROP TABLE participant_groups;
ALTER TABLE participant_groups_new RENAME TO participant_groups;

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

INSERT INTO participant_group_memberships (group_id, edition_id, participant_id, assigned_by_user_id, assigned_at)
SELECT group_id, edition_id, participant_id, assigned_by_user_id, assigned_at
FROM participant_group_memberships_backup;

DROP TABLE participant_group_memberships_backup;

CREATE INDEX participant_groups_pendamping_idx ON participant_groups(pendamping_user_id, edition_id);
CREATE INDEX participant_group_memberships_participant_idx ON participant_group_memberships(participant_id, edition_id);

CREATE TRIGGER participant_groups_require_pendamping_insert
BEFORE INSERT ON participant_groups
FOR EACH ROW
WHEN NEW.pendamping_user_id IS NOT NULL
  AND COALESCE((SELECT role FROM staff_profiles WHERE user_id=NEW.pendamping_user_id), '') != 'pendamping'
BEGIN
  SELECT RAISE(ABORT, 'participant group owner must be pendamping');
END;

CREATE TRIGGER participant_groups_require_pendamping_update
BEFORE UPDATE OF pendamping_user_id ON participant_groups
FOR EACH ROW
WHEN NEW.pendamping_user_id IS NOT NULL
  AND COALESCE((SELECT role FROM staff_profiles WHERE user_id=NEW.pendamping_user_id), '') != 'pendamping'
BEGIN
  SELECT RAISE(ABORT, 'participant group owner must be pendamping');
END;

CREATE TRIGGER staff_profiles_keep_assigned_pendamping_role
BEFORE UPDATE OF role ON staff_profiles
FOR EACH ROW
WHEN OLD.role='pendamping'
  AND NEW.role!='pendamping'
  AND EXISTS(SELECT 1 FROM participant_groups WHERE pendamping_user_id=OLD.user_id)
BEGIN
  SELECT RAISE(ABORT, 'assigned pendamping role cannot be changed');
END;

CREATE TRIGGER staff_profiles_keep_assigned_pendamping
BEFORE DELETE ON staff_profiles
FOR EACH ROW
WHEN OLD.role='pendamping'
  AND EXISTS(SELECT 1 FROM participant_groups WHERE pendamping_user_id=OLD.user_id)
BEGIN
  SELECT RAISE(ABORT, 'assigned pendamping profile cannot be deleted');
END;

WITH group_names(name) AS (
  VALUES ('Horison'), ('Antares'), ('Phoenix'), ('Pegasus'),
    ('Kaldera'), ('Helios'), ('Cisco'), ('Euphoria'),
    ('Andromeda'), ('Apollo'), ('Pandora'), ('Elecra'),
    ('Galaxy'), ('Orion'), ('Altair'), ('Vega')
)
INSERT INTO participant_groups (edition_id, name)
SELECT e.id, group_names.name
FROM event_editions e
CROSS JOIN group_names
WHERE e.year=2026
  AND NOT EXISTS (
    SELECT 1 FROM participant_groups existing
    WHERE existing.edition_id=e.id AND existing.name=group_names.name
  );
